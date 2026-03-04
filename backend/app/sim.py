"""Core simulation logic for the EV grid simulator API.

This module defines functions to estimate charger utilization, service quality,
profitability, coverage, and time-to-market penalties based on build decisions
and scenario parameters. The calculations herein are simplified proxies for
real-world phenomena and should be replaced or refined with domain-specific
models for production use.
"""

from __future__ import annotations
import math
from typing import Dict, List, Tuple


# Simplified unit economics (replace with real values later)
CAPEX = {
    "AC_22": 8_000,  # cost per plug (hardware + install proxy)
    "DC_100": 70_000,
    "DC_200": 120_000,
}

OPEX_PER_PLUG_PER_YEAR = {
    "AC_22": 900,
    "DC_100": 2_500,
    "DC_200": 3_400,
}

# Power / throughput proxies
# kWh per session proxy and sessions capacity per plug per day
KWH_PER_SESSION = {"AC_22": 18, "DC_100": 35, "DC_200": 45}
SESSIONS_CAPACITY_PER_PLUG_DAY = {"AC_22": 5.0, "DC_100": 10.0, "DC_200": 12.0}

# Pricing proxy (€/kWh)
PRICE_PER_KWH = 0.55
ENERGY_COST_PER_KWH = 0.22


def clamp(x: float, lo: float, hi: float) -> float:
    """Clamp a value x to the inclusive range [lo, hi]."""
    return max(lo, min(hi, x))


def logistic(x: float) -> float:
    """Standard logistic function."""
    return 1.0 / (1.0 + math.exp(-x))


def compute_site_daily_demand_sessions(demand_index: float, ev_mult: float) -> float:
    """Proxy mapping of a site demand index to expected sessions per day."""
    # demand_index is roughly 0..10. We map this to a baseline demand.
    base = 2.0 + 3.0 * demand_index
    return base * ev_mult


def utilization(demand_sessions: float, capacity_sessions: float) -> float:
    """Compute utilization (ratio of demand to capacity), capped at 200%."""
    if capacity_sessions <= 0:
        return 1.0
    return clamp(demand_sessions / capacity_sessions, 0.0, 2.0)


def service_from_util(u: float) -> float:
    """Map utilization to a service quality score in the range [0, 1]."""
    # Higher utilization reduces service quality. The logistic function provides
    # a smooth decay after roughly u=0.85.
    return clamp(1.0 - logistic((u - 0.85) * 8.0), 0.0, 1.0)


def coverage_from_sites(n_sites: int) -> float:
    """Estimate coverage based on the number of unique sites, saturating with more sites."""
    # As the number of sites grows, the incremental coverage benefit diminishes.
    return clamp(1.0 - math.exp(-n_sites / 120.0), 0.0, 1.0)


def time_to_market_score(n_sites: int, max_sites_per_month: int, months: int) -> float:
    """Score the deployability of a plan based on rollout capacity and horizon."""
    deployable = max_sites_per_month * months
    overload = max(0, n_sites - deployable)
    if deployable <= 0:
        return 0.0
    ratio = overload / deployable
    return clamp(1.0 - ratio * 2.0, 0.0, 1.0)


def normalize_profit(profit: float) -> float:
    """Normalize profit to a 0..1 range using an arbitrary scale."""
    # This linear scaling is a placeholder; calibrate with real-world ranges.
    return clamp(0.4 + profit / 3_000_000.0, 0.0, 1.0)


def simulate(
    builds: List[Tuple[str, str, int]],
    site_demand_index: Dict[str, float],
    ev_mult: float,
    elec_mult: float,
    outage_rate: float,
    capex_budget: float,
    max_sites_per_month: int,
    months: int,
) -> Tuple[Dict[str, float], Dict[str, str]]:
    """Simulate deployment and return raw KPIs plus any constraint violations.

    Args:
        builds: A list of tuples (site_id, charger_type, plugs).
        site_demand_index: Demand index lookup per site.
        ev_mult: EV growth multiplier.
        elec_mult: Electricity price multiplier.
        outage_rate: Fraction of downtime for chargers.
        capex_budget: Maximum allowed capital expenditure.
        max_sites_per_month: Build capacity per month.
        months: Deployment horizon in months.

    Returns:
        A tuple consisting of a dictionary of raw KPIs and a dictionary of constraint violations.
    """

    # Group build decisions by site
    by_site: Dict[str, List[Tuple[str, int]]] = {}
    for site_id, ctype, plugs in builds:
        by_site.setdefault(site_id, []).append((ctype, plugs))

    n_sites = len(by_site)
    capex = 0.0
    opex = 0.0
    revenue = 0.0
    profit = 0.0
    service_scores: List[float] = []

    for site_id, configs in by_site.items():
        demand_index = site_demand_index.get(site_id, 0.0)
        demand_sessions_day = compute_site_daily_demand_sessions(demand_index, ev_mult)

        site_capacity_sessions_day = 0.0
        site_plugs = 0

        for ctype, plugs in configs:
            site_plugs += plugs
            capex += CAPEX[ctype] * plugs
            opex += OPEX_PER_PLUG_PER_YEAR[ctype] * plugs
            site_capacity_sessions_day += SESSIONS_CAPACITY_PER_PLUG_DAY[ctype] * plugs

        # Apply outage derating to capacity
        effective_capacity = site_capacity_sessions_day * (1.0 - clamp(outage_rate, 0.0, 0.5))
        u = utilization(demand_sessions_day, effective_capacity)

        # Served sessions are limited by capacity
        served_sessions_day = min(demand_sessions_day, effective_capacity)

        # Weighted average kWh per session
        avg_kwh_session = 0.0
        if site_plugs > 0:
            for ctype, plugs in configs:
                avg_kwh_session += KWH_PER_SESSION[ctype] * (plugs / site_plugs)

        annual_kwh = served_sessions_day * avg_kwh_session * 365.0
        annual_revenue = annual_kwh * PRICE_PER_KWH
        annual_energy_cost = annual_kwh * (ENERGY_COST_PER_KWH * elec_mult)

        revenue += annual_revenue
        profit += (annual_revenue - annual_energy_cost)
        service_scores.append(service_from_util(u))

    # Net profit after opex
    profit -= opex

    # Constraint checks
    violations: Dict[str, str] = {}
    if capex > capex_budget:
        violations["capex_budget"] = f"CAPEX exceeds budget: {capex:,.0f}€ > {capex_budget:,.0f}€"
    deployable = max_sites_per_month * months
    if n_sites > deployable:
        violations["deployment_capacity"] = f"Too many sites for rollout capacity: {n_sites} > {deployable}"

    coverage = coverage_from_sites(n_sites)
    service = sum(service_scores) / len(service_scores) if service_scores else 0.0
    ttm = time_to_market_score(n_sites, max_sites_per_month, months)

    # Penalize the score when constraints are violated
    penalty = 1.0
    if "capex_budget" in violations:
        penalty *= 0.65
    if "deployment_capacity" in violations:
        penalty *= 0.75

    return (
        {
            "capex_eur": capex,
            "opex_eur_per_year": opex,
            "revenue_eur_per_year": revenue,
            "profit_eur_per_year": profit,
            "coverage_score": coverage,
            "service_score": service,
            "time_to_market_score": ttm,
            "penalty": penalty,
        },
        violations,
    )
