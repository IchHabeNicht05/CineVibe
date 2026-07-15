/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/comments/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializace Supabase s tajným Service Role klíčem, který umí obcházet RLS při zápisu ze serveru
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1. NAČÍTÁNÍ KOMENTÁŘŮ (S podporou stránkování a předáváním userId)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get("mediaId");
  const mediaType = searchParams.get("mediaType");
  
  // Načtení parametrů pro stránkování (případně výchozí hodnoty)
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);

  if (!mediaId || !mediaType) {
    return NextResponse.json({ error: "Chybí parametry" }, { status: 400 });
  }

  // Výpočet rozsahu (range/offset) pro PostgreSQL
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("*")
    .eq("media_id", mediaId)
    .eq("media_type", mediaType)
    .order("created_at", { ascending: false })
    .range(from, to); // <- Tady omezíme výběr podle stránky

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Mapování na frontendové props (včetně userId pro kontrolu práv k mazání!)
  const formattedComments = data.map((c: any) => ({
    id: c.id,
    username: c.username,
    text: c.text,
    createdAt: c.created_at,
    userId: c.user_id, // <- KLÍČOVÉ: Frontend teď bude vědět, komu komentář patří!
  }));

  return NextResponse.json(formattedComments);
}

// 2. BEZPEČNÝ ZÁPIS KOMENTÁŘE (Pouze pro přihlášené přes Bearer token)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mediaId, mediaType, username, text } = body;

    if (!mediaId || !mediaType || !text.trim()) {
      return NextResponse.json({ error: "Chybí povinná pole" }, { status: 400 });
    }

    const authHeader = request.headers.get("Authorization");
    let userId = null;
    let finalUsername = username; 

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      
      const supabaseProvider = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user }, error: userError } = await supabaseProvider.auth.getUser(token);

      if (user && !userError) {
        userId = user.id;
        finalUsername = username || user.user_metadata?.username || (user.email ? user.email.split("@")[0] : "Uživatel");
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Pro přidání komentáře se musíte přihlásit." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("comments")
      .insert([
        {
          media_id: String(mediaId),
          media_type: mediaType,
          username: finalUsername,
          text: text,
          user_id: userId
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      username: data.username,
      text: data.text,
      createdAt: data.created_at,
      userId: data.user_id, // Vracíme i userId hned po uložení
    });

  } catch (err: any) {
    console.error("Chyba API:", err);
    return NextResponse.json({ error: err.message || "Chyba serveru" }, { status: 500 });
  }
}

// 3. BEZPEČNÉ MAZÁNÍ KOMENTÁŘE (Metoda DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json({ error: "Chybí ID komentáře" }, { status: 400 });
    }

    // A. Ověření, že uživatel posílá platný přihlašovací token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Neautorizovaný přístup" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const supabaseProvider = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: userError } = await supabaseProvider.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Neplatný nebo expirovaný token" }, { status: 401 });
    }

    // B. Kontrola vlastnictví v DB (Předcházíme tomu, aby někdo smazal cizí komentář)
    const { data: existingComment, error: fetchError } = await supabaseAdmin
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: "Komentář nebyl nalezen" }, { status: 404 });
    }

    // Porovnání: Shoduje se ID přihlášeného s autorem v databázi?
    if (existingComment.user_id !== user.id) {
      return NextResponse.json(
        { error: "Nemáte oprávnění smazat tento komentář" }, 
        { status: 403 }
      );
    }

    // C. Bezpečné smazání
    const { error: deleteError } = await supabaseAdmin
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: "Komentář byl smazán" });

  } catch (err: any) {
    console.error("Chyba při mazání komentáře:", err);
    return NextResponse.json({ error: err.message || "Chyba serveru" }, { status: 500 });
  }
}