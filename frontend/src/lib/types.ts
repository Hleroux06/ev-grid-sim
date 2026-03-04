export type ChargerType = "AC_22" | "DC_100" | "DC_200";

export type CandidateSite = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  demand_index: number;
};

export type BuildDecision = {
  site_id: string;
  charger_type: ChargerType;
  plugs: number;
};

export type SimRequest = {
  builds: BuildDecision[];
  weights: { profit: number; service: number; coverage: number; time: number };
  scenario: { ev_growth_multiplier: number; electricity_price_multiplier: number; outage_rate: number };
  constraints: { capex_budget_eur: number; max_sites_per_month: number; months_horizon: number };
};

export type SimResponse = {
  score: number;
  kpis: {
    capex_eur: number;
    opex_eur_per_year: number;
    revenue_eur_per_year: number;
    profit_eur_per_year: number;
    coverage_score: number;
    service_score: number;
    time_to_market_score: number;
    constraint_violations: Record<string, string>;
  };
  debug?: Record<string, number>;
};
