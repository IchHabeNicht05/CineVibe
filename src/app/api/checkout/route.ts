import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any, // Použij stabilní verzi API
});

export async function POST(request: Request) {
  try {
    const { userId, userEmail } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Chybí ID uživatele" }, { status: 400 });
    }

    // Vytvoření Stripe Checkout Session pro jednorázovou platbu
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "czk",
            product_data: {
              name: "CineVibe Premium",
              description: "Vibe Score, žánrový radar a pokročilé statistiky navždy.",
            },
            unit_amount: 7900, // Částka v haléřích (79.00 Kč)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // Předáme ID uživatele do metadata, abychom ho v webhooku identifikovali
      metadata: {
        userId: userId,
      },
      customer_email: userEmail,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/premium?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/premium?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Chyba při vytváření Stripe session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}