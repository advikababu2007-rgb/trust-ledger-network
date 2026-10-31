import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { success: false, error: "Supabase environment variables are not configured." },
      { status: 500 }
    );
  }

  let body: { orderId?: unknown; email?: unknown; totalAmount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const { orderId, email } = body;
  const totalAmount = Number(body.totalAmount);

  if (
    (typeof orderId !== "string" && typeof orderId !== "number") ||
    String(orderId).trim() === "" ||
    typeof email !== "string" ||
    email.trim() === "" ||
    !Number.isFinite(totalAmount) ||
    totalAmount < 0
  ) {
    return NextResponse.json(
      { success: false, error: "Required: orderId, email, and a non-negative numeric totalAmount." },
      { status: 400 }
    );
  }

  const donationAmount = parseFloat((totalAmount * 0.01).toFixed(2));

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      external_order_id: String(orderId),
      customer_email: email.trim(),
      total_amount: totalAmount,
      donation_amount: donationAmount,
      status: "verified_and_settled",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, donation_amount: donationAmount, order: data },
    { status: 200 }
  );
}
