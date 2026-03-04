from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path

from .models import SimRequest, SimResponse, Kpis, CandidateSite
from .sim import simulate, normalize_profit, clamp

app = FastAPI(title="EV Grid Simulator API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent / "data" / "candidates_spain_sample.json"
CANDIDATES = [CandidateSite(**x) for x in json.loads(DATA_PATH.read_text(encoding="utf-8"))]
DEMAND_INDEX = {c.id: c.demand_index for c in CANDIDATES}


@app.get("/candidates")
def get_candidates():
    """Return a list of candidate sites."""
    return [c.model_dump() for c in CANDIDATES]


@app.post("/simulate", response_model=SimResponse)
def post_simulate(req: SimRequest):
    """Run a simulation based on build decisions and return KPIs."""
    builds = [(b.site_id, b.charger_type, b.plugs) for b in req.builds]

    kpi_raw, violations = simulate(
        builds=builds,
        site_demand_index=DEMAND_INDEX,
        ev_mult=req.scenario.ev_growth_multiplier,
        elec_mult=req.scenario.electricity_price_multiplier,
        outage_rate=req.scenario.outage_rate,
        capex_budget=req.constraints.capex_budget_eur,
        max_sites_per_month=req.constraints.max_sites_per_month,
        months=req.constraints.months_horizon,
    )

    profit_score = normalize_profit(kpi_raw["profit_eur_per_year"])

    # Weighted score (0..100)
    w = req.weights
    score_0_1 = (
        w.profit * profit_score
        + w.service * kpi_raw["service_score"]
        + w.coverage * kpi_raw["coverage_score"]
        + w.time * kpi_raw["time_to_market_score"]
    )
    score_0_1 *= kpi_raw["penalty"]
    score = 100.0 * clamp(score_0_1, 0.0, 1.0)

    kpis = Kpis(
        capex_eur=kpi_raw["capex_eur"],
        opex_eur_per_year=kpi_raw["opex_eur_per_year"],
        revenue_eur_per_year=kpi_raw["revenue_eur_per_year"],
        profit_eur_per_year=kpi_raw["profit_eur_per_year"],
        coverage_score=kpi_raw["coverage_score"],
        service_score=kpi_raw["service_score"],
        time_to_market_score=kpi_raw["time_to_market_score"],
        constraint_violations=violations,
    )

    return SimResponse(score=score, kpis=kpis, debug={"profit_score": profit_score, "penalty": kpi_raw["penalty"]})
