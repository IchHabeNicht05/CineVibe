import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

// Inicializace Supabase s Service Role Key (aby mohl webhook měnit data uživatelů i bez přihlášení)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Tento klíč drž v tajnosti!
);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`❌ Chyba verifikace webhooku: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Pokud platba proběhla úspěšně
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (userId) {
      console.log(`🔔 Aktivuji Premium pro uživatele: ${userId}`);

      // Aktualizace uživatelského profilu v Supabase
      const { error } = await supabaseAdmin
        .from("profiles") // Název tvé tabulky s profily
        .update({ is_premium: true })
        .eq("id", userId);

      if (error) {
        console.error("Chyba při aktualizaci profilu v Supabase:", error);
        return NextResponse.json({ error: "Chyba databáze" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}