export type UserRole = "resident" | "volunteer" | "recycler" | "ngo_admin";

export type ReportStatus = "open" | "claimed" | "collected" | "resolved";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  organization_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string | null;
  reporter_name: string | null;
  location_description: string;
  description: string;
  photo_url: string | null;
  status: ReportStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

// Shape returned by the `report_points` SQL view — flattened lat/lng
// for easy use with Leaflet, no PostGIS parsing needed client-side.
export interface ReportPoint {
  id: string;
  location_description: string;
  description: string;
  status: ReportStatus;
  photo_url: string | null;
  created_at: string;
  lat: number;
  lng: number;
}

export interface RecyclingPartner {
  id: string;
  profile_id: string;
  org_name: string;
  materials_accepted: string[];
  service_area: string | null;
  verified: boolean;
  created_at: string;
}
