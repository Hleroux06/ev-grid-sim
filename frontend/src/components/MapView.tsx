"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CandidateSite } from "../lib/types";

// Configure default marker icons to load correctly from Leaflet CDN
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({
  candidates,
  selectedSiteIds,
  onToggleSite,
}: {
  candidates: CandidateSite[];
  selectedSiteIds: Set<string>;
  onToggleSite: (siteId: string) => void;
}) {
  return (
    <div
      style={{
        height: 520,
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
      }}
    >
      <MapContainer center={[40.4168, -3.7038]} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {candidates.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lon]}>
            <Popup>
              <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                <div>
                  <b>{c.name}</b>
                </div>
                <div>Demand index: {c.demand_index.toFixed(2)}</div>
                <button
                  onClick={() => onToggleSite(c.id)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #111827",
                    background: selectedSiteIds.has(c.id) ? "#111827" : "white",
                    color: selectedSiteIds.has(c.id) ? "white" : "#111827",
                    cursor: "pointer",
                  }}
                >
                  {selectedSiteIds.has(c.id) ? "Remove from plan" : "Add to plan"}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
