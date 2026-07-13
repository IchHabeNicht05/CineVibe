// src/app/api/auth/check-username/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Použijeme Admin klíč, abychom mohli prohledat seznam uživatelů
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Chybí parametr username" }, { status: 400 });
    }

    // Získáme seznam všech uživatelů z auth systému
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw error;

    // Prohledáme metadata a zjistíme, jestli jméno už existuje (ignorujeme velká/malá písmena)
    const exists = users.some(u => 
      u.user_metadata?.username?.toLowerCase() === username.toLowerCase()
    );

    return NextResponse.json({ exists });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Chyba serveru" }, { status: 500 });
  }
}