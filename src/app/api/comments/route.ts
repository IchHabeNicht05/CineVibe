// src/app/api/comments/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializace Supabase s tajným Service Role klíčem, který umí obcházet RLS při zápisu ze serveru
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1. NAČÍTÁNÍ KOMENTÁŘŮ (Zůstává veřejné)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get("mediaId");
  const mediaType = searchParams.get("mediaType");

  if (!mediaId || !mediaType) {
    return NextResponse.json({ error: "Chybí parametry" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("*")
    .eq("media_id", mediaId)
    .eq("media_type", mediaType)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Mapování na frontendové props
  const formattedComments = data.map((c: any) => ({
    id: c.id,
    username: c.username,
    text: c.text,
    createdAt: c.created_at,
  }));

  return NextResponse.json(formattedComments);
}

// 2. BEZPEČNÝ ZÁPIS KOMENTÁŘE (Pouze pro přihlášené přes Bearer token)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Nově z frontendu přijímáme i 'username', které už obsahuje správný nickname
    const { mediaId, mediaType, username, text } = body;

    if (!mediaId || !mediaType || !text.trim()) {
      return NextResponse.json({ error: "Chybí povinná pole" }, { status: 400 });
    }

    // Vytáhneme bezpečný token přímo z hlavičky požadavku
    const authHeader = request.headers.get("Authorization");
    let userId = null;
    let finalUsername = username; 

    // Ověření tokenu proti Supabase
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      
      const supabaseProvider = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Zeptáme se Supabase, komu tento token patří
      const { data: { user }, error: userError } = await supabaseProvider.auth.getUser(token);

      if (user && !userError) {
        userId = user.id;
        // Pojistka: pokud by frontend neposlal jméno, zkusíme ho najít u uživatele
        finalUsername = username || user.user_metadata?.username || (user.email ? user.email.split("@")[0] : "Uživatel");
      }
    }

    // Přísná kontrola: Pokud backend nezná uživatele, nepustí to dál
    if (!userId) {
      return NextResponse.json({ error: "Pro přidání komentáře se musíte přihlásit." }, { status: 401 });
    }

    // Zápis do databáze přes Admin klíč (využijeme zjištěné ID a finální jméno)
    const { data, error } = await supabaseAdmin
      .from("comments")
      .insert([
        {
          media_id: String(mediaId),
          media_type: mediaType,
          username: finalUsername,
          text: text,
          user_id: userId // Teď už to bude spolehlivě UUID!
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
    });

  } catch (err: any) {
    console.error("Chyba API:", err);
    return NextResponse.json({ error: err.message || "Chyba serveru" }, { status: 500 });
  }
}