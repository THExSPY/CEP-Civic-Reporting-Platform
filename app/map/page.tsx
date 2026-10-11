import { redirect } from "next/navigation";

// The hotspot map now lives on the home page. Keep this route so old
// links and bookmarks still land in the right place.
export default function MapPage() {
  redirect("/#map");
}
