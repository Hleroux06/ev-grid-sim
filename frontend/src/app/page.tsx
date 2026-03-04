"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Controls from "../components/Controls";
import KpiPanel from "../components/KpiPanel";
import { fetchCandidates, runSim } from "../lib/api";
import { CandidateSite, ChargerType, SimResponse } from "../lib/types";

// Dynamically load the map to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("../components/MapView"), { ssr: false });

export default function Page() {
  const [candidates, setCandidates] = useState<CandidateSite[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(new Set());
  const [chargerType, setChargerType] = useState<ChargerType>("DC_100");
  const [plugs, setPlugs] = useState<number>(4);
  const [capexBudget, setCapexBudget] = useState<number>(5_000_000);
  const [maxSitesPerMonth, setMaxSitesPerMonth] = useState<number>(25);
  const [monthsHorizon, setMonthsHorizon] = useState<number>(12);
  const [weights, setWeights] = useState({ profit: 0.35, service: 0.35, coverage: 0.2, time: 0.1 });
  const [scenario, setScenario] = useState({
    ev_growth_multiplier: 1.0,
    electricity_price_multiplier: 1.0,
    outage_rate: 0.03,
  });
  const [res, setRes] = useState<SimResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidates().then(setCandidates).catch((e) => setErr(String(e)));
  }, []);

  const builds = useMemo(() => {
    return Array.from(selectedSiteIds).map((siteId) => ({
      site_id: siteId,
      charger_type: chargerType,
      plugs,
    }));
  }, [selectedSiteIds, chargerType, plugs]);

  function toggleSite(siteId: string) {
    setSelectedSiteIds((prev) => {
      const n = new Set(prev);
      if (n.has(siteId)) n.delete(siteId);
      else n.add(siteId);
      return n;
    });
  }

  async function onSimulate() {
    setBusy(true);
    setErr(null);
    try {
      const out = await runSim({
        builds,
        weights,
        scenario,
        constraints: {
          capex_budget_eur: capexBudget,
          max_sites_per_month: maxSitesPerMonth,
          months_horizon: monthsHorizon,
        },
      });
      setRes(out);
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 22, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26 }}>EV Charger Grid Simulator (MVP)</h1>
            <div style={{ color: "#6b7280" }}>
              Click sites on the map to build. Run simulation to compute KPIs and score.
            </div>
          </div>
          <button
            onClick={onSimulate}
            disabled={busy}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #111827",
              background: "#111827",
              color: "white",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            {busy ? "Running..." : "Run simulation"}
          </button>
        </div>
        {err && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 12,
              background: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            {err}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginTop: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <MapView
              candidates={candidates}
              selectedSiteIds={selectedSiteIds}
              onToggleSite={toggleSite}
            />
            <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 16 }}>
              <div style={{ fontWeight: 800 }}>Current plan</div>
              <div style={{ color: "#6b7280", marginTop: 6 }}>
                Sites selected: <b>{selectedSiteIds.size}</b> — Type: <b>{chargerType}</b> — Plugs/site: <b>{plugs}</b>
              </div>
            </div>
            <KpiPanel res={res} />
          </div>
          <Controls
            chargerType={chargerType}
            setChargerType={setChargerType}
            plugs={plugs}
            setPlugs={setPlugs}
            capexBudget={capexBudget}
            setCapexBudget={setCapexBudget}
            maxSitesPerMonth={maxSitesPerMonth}
            setMaxSitesPerMonth={setMaxSitesPerMonth}
            monthsHorizon={monthsHorizon}
            setMonthsHorizon={setMonthsHorizon}
            weights={weights}
            setWeights={setWeights}
            scenario={scenario}
            setScenario={setScenario}
          />
        </div>
      </div>
    </main>
  );
}
