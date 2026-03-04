import { CandidateSite, SimRequest, SimResponse } from "./types";

const API = "http://localhost:8000";

/**
 * Fetch the list of candidate sites from the backend API.
 */
export async function fetchCandidates(): Promise<CandidateSite[]> {
  const r = await fetch(API + "/candidates");
  if (!r.ok) throw new Error("Failed to load candidates");
  return r.json();
}

/**
 * Run the simulation on the server with the specified request body.
 */
export async function runSim(req: SimRequest): Promise<SimResponse> {
  const r = await fetch(API + "/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!r.ok) throw new Error("Simulation failed");
  return r.json();
}
