"""Pydantic models defining request and response schemas for the EV grid simulator API."""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Literal, Dict, Optional

# Enumerate charger types supported by the simulator
ChargerType = Literal["AC_22", "DC_100", "DC_200"]


class CandidateSite(BaseModel):
    """Representation of a possible charger location with a demand indicator."""

    id: str
    name: str
    lat: float
    lon: float
    demand_index: float = Field(..., ge=0)  # proxy for demand intensity at this site


class BuildDecision(BaseModel):
    """A decision to build chargers at a specific site."""

    site_id: str
    charger_type: ChargerType
    plugs: int = Field(..., ge=1, le=40)


class Weights(BaseModel):
    """Weighting factors for the objective function components."""

    profit: float = 0.35
    service: float = 0.35
    coverage: float = 0.20
    time: float = 0.10


class Scenario(BaseModel):
    """Scenario multipliers capturing demand, price, and outage conditions."""

    ev_growth_multiplier: float = 1.0
    electricity_price_multiplier: float = 1.0
    outage_rate: float = 0.03  # fraction of time a site is unavailable


class Constraints(BaseModel):
    """Resource and time constraints for deployment."""

    capex_budget_eur: float = 5_000_000
    max_sites_per_month: int = 25
    months_horizon: int = 12


class SimRequest(BaseModel):
    """Input to the simulation API."""

    builds: List[BuildDecision]
    weights: Weights
    scenario: Scenario
    constraints: Constraints


class Kpis(BaseModel):
    """Key performance indicators returned by the simulation."""

    capex_eur: float
    opex_eur_per_year: float
    revenue_eur_per_year: float
    profit_eur_per_year: float
    coverage_score: float
    service_score: float
    time_to_market_score: float
    constraint_violations: Dict[str, str]


class SimResponse(BaseModel):
    """Full simulation response including overall score and KPIs."""

    score: float
    kpis: Kpis
    debug: Optional[Dict[str, float]] = None
