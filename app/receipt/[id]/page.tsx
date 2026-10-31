import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Order = {
  id: string | number;
  external_order_id: string;
  customer_email: string;
  total_amount: number | string;
  donation_amount: number | string;
  status: string;
  created_at?: string;
};

const money = (v: number | string) =>
  Number(v).toLocaleString("en-US", { style: "currency", currency: "USD" });

async function getOrder(id: string): Promise<Order | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables.");

  const res = await fetch(
    `${url}/rest/v1/orders?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    }
  );

  // A malformed id (e.g. non-numeric for a bigint column) returns 400 -> treat as not found
  if (res.status === 400) return null;
  if (!res.ok) throw new Error(`Supabase responded with ${res.status}`);

  const rows = (await res.json()) as Order[];
  return rows[0] ?? null;
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "Receipt ID", value: String(order.id), mono: true },
    { label: "External Order ID", value: order.external_order_id, mono: true },
    { label: "Customer Email", value: order.customer_email },
    ...(order.created_at
      ? [{ label: "Recorded", value: new Date(order.created_at).toUTCString() }]
      : []),
  ];

  const settled = order.status === "verified_and_settled";

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
      <Link href="/" style={{ color: "#a1a1aa", fontSize: 14 }}>
        ← Back to ledger
      </Link>

      <article
        style={{
          marginTop: 24,
          background: "#111113",
          border: "1px solid #27272a",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <header
          style={{
            padding: "28px 32px",
            borderBottom: "1px solid #27272a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a1a1aa" }}>
              Trust Ledger
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>Transaction Confirmation</h1>
          </div>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: settled ? "#052e1c" : "#27272a",
              color: settled ? "#34d399" : "#a1a1aa",
              border: `1px solid ${settled ? "#065f46" : "#3f3f46"}`,
            }}
          >
            {order.status}
          </span>
        </header>

        <section style={{ padding: "8px 32px" }}>
          {rows.map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 0",
                borderBottom: "1px solid #1f1f23",
                fontSize: 14,
              }}
            >
              <span style={{ color: "#a1a1aa" }}>{r.label}</span>
              <span
                style={{
                  fontFamily: r.mono ? "ui-monospace, monospace" : undefined,
                  textAlign: "right",
                  wordBreak: "break-all",
                }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </section>

        <section style={{ padding: "8px 32px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", fontSize: 14 }}>
            <span style={{ color: "#a1a1aa" }}>Order Total</span>
            <span>{money(order.total_amount)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "16px 20px",
              fontSize: 16,
              fontWeight: 600,
              background: "#052e1c",
              border: "1px solid #065f46",
              borderRadius: 10,
              color: "#34d399",
            }}
          >
            <span>1% Trust Allocation</span>
            <span>{money(order.donation_amount)}</span>
          </div>
        </section>

        <footer
          style={{
            padding: "16px 32px",
            borderTop: "1px solid #27272a",
            fontSize: 12,
            color: "#71717a",
          }}
        >
          This receipt is generated from the immutable ledger record above.
        </footer>
      </article>
    </main>
  );
}
