"use client";

import { SimResponse } from "../lib/types";

/**
 * Utility to format numbers as Euro currency strings.
 */
function fmtEur(x: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(x);
}

export default function KpiPanel({ res }: { res: SimResponse | null }) {
  if (!res) return <div style={{ color: "#6b7280" }}>Run a simulation to see KPIs.</div>;
  const v = res.kpis.constraint_violations || {};
  const violations = Object.values(v);
  return (
    <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Score</div>
        <div style={{ fontWeight: 900, fontSize: 22 }}>{res.score.toFixed(1)} / 100</div>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}
      >
        <div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>CAPEX</div>
          <div style={{ fontWeight: 700 }}>{fmtEur(res.kpis.capex_eur)}</div>
        </div>
        <div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>OPEX / year</div>
          <div style={{ fontWeight: 700 }}>{fmtEur(res.kpis.opex_eur_per_year)}</div>
        </div>
        <div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>Revenue / year</div>
          <div style={{ fontWeight: 700 }}>{fmtEur(res.kpis.revenue_eur_per_year)}</div>
        </div>
        <div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>Profit / year</div>
          <div style={{ fontWeight: 700 }}>{fmtEur(res.kpis.profit_eur_per_year)}</div>
        </div>
        <div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>Coverage</div>
          <div style={{ fontWeight: 700 }}>{(res.kpis.coverage_score * 100).toFixed(0)}%</div>
        </div>
        <div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>Service</div>
          <div style={{ fontWeight: 700 }}>{(res.kpis.service_score * 100).toFixed(0)}%</div>
        </div>
        <div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>Time-to-market</div>
          <div style={{ fontWeight: 700 }}>{(res.kpis.time_to_market_score * 100).toFixed(0)}%</div>
        </div>
      </div>
      {violations.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 12,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Constraint warnings</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {violations.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
