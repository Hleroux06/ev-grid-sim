"use client";

import { ChargerType } from "../lib/types";

export default function Controls({
  chargerType,
  setChargerType,
  plugs,
  setPlugs,
  capexBudget,
  setCapexBudget,
  maxSitesPerMonth,
  setMaxSitesPerMonth,
  monthsHorizon,
  setMonthsHorizon,
  weights,
  setWeights,
  scenario,
  setScenario,
}: any) {
  function setWeight(key: string, v: number) {
    setWeights({ ...weights, [key]: v });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Build settings</div>
        <label style={{ display: "block", marginBottom: 6 }}>Charger type</label>
        <select
          value={chargerType}
          onChange={(e) => setChargerType(e.target.value as ChargerType)}
          style={{ width: "100%", padding: 10, borderRadius: 10 }}
        >
          <option value="AC_22">AC 22 kW</option>
          <option value="DC_100">DC 100 kW</option>
          <option value="DC_200">DC 200 kW</option>
        </select>
        <label style={{ display: "block", margin: "10px 0 6px" }}>Plugs per selected site</label>
        <input
          type="number"
          min={1}
          max={40}
          value={plugs}
          onChange={(e) => setPlugs(parseInt(e.target.value || "1"))}
          style={{ width: "100%", padding: 10, borderRadius: 10 }}
        />
      </div>
      <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Constraints</div>
        <label>CAPEX budget (€)</label>
        <input
          type="number"
          value={capexBudget}
          onChange={(e) => setCapexBudget(parseFloat(e.target.value || "0"))}
          style={{ width: "100%", padding: 10, borderRadius: 10, marginTop: 6 }}
        />
        <label style={{ display: "block", marginTop: 10 }}>Max sites per month</label>
        <input
          type="number"
          min={1}
          value={maxSitesPerMonth}
          onChange={(e) => setMaxSitesPerMonth(parseInt(e.target.value || "1"))}
          style={{ width: "100%", padding: 10, borderRadius: 10, marginTop: 6 }}
        />
        <label style={{ display: "block", marginTop: 10 }}>Horizon (months)</label>
        <input
          type="number"
          min={1}
          value={monthsHorizon}
          onChange={(e) => setMonthsHorizon(parseInt(e.target.value || "1"))}
          style={{ width: "100%", padding: 10, borderRadius: 10, marginTop: 6 }}
        />
      </div>
      <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Objective weights (0–1)</div>
        {["profit", "service", "coverage", "time"].map((k) => (
          <div
            key={k}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ textTransform: "capitalize" }}>{k}</div>
            <input
              type="number"
              step={0.05}
              min={0}
              max={1}
              value={weights[k]}
              onChange={(e) => setWeight(k, parseFloat(e.target.value || "0"))}
              style={{ padding: 10, borderRadius: 10 }}
            />
          </div>
        ))}
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Tip: you can keep weights simple; normalization can be added later.
        </div>
      </div>
      <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Scenario</div>
        <label>EV growth multiplier</label>
        <input
          type="number"
          step={0.1}
          value={scenario.ev_growth_multiplier}
          onChange={(e) =>
            setScenario({ ...scenario, ev_growth_multiplier: parseFloat(e.target.value || "1") })
          }
          style={{ width: "100%", padding: 10, borderRadius: 10, marginTop: 6 }}
        />
        <label style={{ display: "block", marginTop: 10 }}>Electricity price multiplier</label>
        <input
          type="number"
          step={0.1}
          value={scenario.electricity_price_multiplier}
          onChange={(e) =>
            setScenario({ ...scenario, electricity_price_multiplier: parseFloat(e.target.value || "1") })
          }
          style={{ width: "100%", padding: 10, borderRadius: 10, marginTop: 6 }}
        />
        <label style={{ display: "block", marginTop: 10 }}>Outage rate</label>
        <input
          type="number"
          step={0.01}
          min={0}
          max={0.5}
          value={scenario.outage_rate}
          onChange={(e) =>
            setScenario({ ...scenario, outage_rate: parseFloat(e.target.value || "0") })
          }
          style={{ width: "100%", padding: 10, borderRadius: 10, marginTop: 6 }}
        />
      </div>
    </div>
  );
}
