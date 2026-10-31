import Link from "next/link";

export const dynamic = "force-dynamic";

type Order = {
  id: string | number;
  external_order_id: string;
  customer_email: string;
  total_amount: number | string;
  donation_amount: number | string;
  status: string;
};

async function getOrders(): Promise<{ orders: Order[]; error: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      orders: [],
      error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  try {
    const res = await fetch(`${url}/rest/v1/orders?select=*&order=id.desc`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { orders: [], error: `Supabase responded with ${res.status}: ${await res.text()}` };
    }

    return { orders: (await res.json()) as Order[], error: null };
  } catch (err) {
    return { orders: [], error: err instanceof Error ? err.message : "Unknown fetch error" };
  }
}

const money = (v: number | string) =>
  Number(v).toLocaleString("en-US", { style: "currency", currency: "USD" });

export default async function DashboardPage() {
  const { orders, error } = await getOrders();

  const totalVolume = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const totalDonations = orders.reduce((s, o) => s + Number(o.donation_amount || 0), 0);

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#a1a1aa",
    borderBottom: "1px solid #27272a",
    whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: 14,
    borderBottom: "1px solid #18181b",
  };
  const card: React.CSSProperties = {
    flex: "1 1 200px",
    background: "#111113",
    border: "1px solid #27272a",
    borderRadius: 12,
    padding: 20,
  };
  const cardLabel: React.CSSProperties = {
    color: "#a1a1aa",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Trust Ledger</h1>
        <p style={{ color: "#a1a1aa", marginTop: 6, fontSize: 14 }}>
          Verified orders and 1% trust allocations.
        </p>
      </header>

      <section style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <div style={card}>
          <div style={cardLabel}>Orders</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8 }}>{orders.length}</div>
        </div>
        <div style={card}>
          <div style={cardLabel}>Total Volume</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8 }}>{money(totalVolume)}</div>
        </div>
        <div style={card}>
          <div style={cardLabel}>Trust Allocated</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: "#34d399" }}>
            {money(totalDonations)}
          </div>
        </div>
      </section>

      {error && (
        <div
          style={{
            background: "#2a1215",
            border: "1px solid #7f1d1d",
            color: "#fca5a5",
            padding: 16,
            borderRadius: 10,
            marginBottom: 24,
            fontSize: 14,
            wordBreak: "break-word",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "#111113",
          border: "1px solid #27272a",
          borderRadius: 12,
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr>
              <th style={th}>External Order ID</th>
              <th style={th}>Customer Email</th>
              <th style={{ ...th, textAlign: "right" }}>Total Amount</th>
              <th style={{ ...th, textAlign: "right" }}>1% Donation</th>
              <th style={th}>Audit Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && !error && (
              <tr>
                <td colSpan={5} style={{ ...td, textAlign: "center", color: "#71717a", padding: 40 }}>
                  No orders recorded yet.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id}>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>
                  <Link href={`/receipt/${o.id}`} style={{ color: "#60a5fa" }}>
                    {o.external_order_id}
                  </Link>
                </td>
                <td style={td}>{o.customer_email}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(o.total_amount)}</td>
                <td style={{ ...td, textAlign: "right", color: "#34d399" }}>{money(o.donation_amount)}</td>
                <td style={td}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: o.status === "verified_and_settled" ? "#052e1c" : "#27272a",
                      color: o.status === "verified_and_settled" ? "#34d399" : "#a1a1aa",
                      border: `1px solid ${o.status === "verified_and_settled" ? "#065f46" : "#3f3f46"}`,
                    }}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
