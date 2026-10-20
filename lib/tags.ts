export interface TagDefinition {
  id: string;
  label: string;
  color: string; // Tailwind color classes for badges
  badgeClass: string;
}

export const COMMON_TAGS: TagDefinition[] = [
  { id: "Plastic Waste", label: "Plastic Waste", color: "#0284c7", badgeClass: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "River / Nala", label: "River / Nala", color: "#0891b2", badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { id: "Construction Debris", label: "Construction Debris", color: "#d97706", badgeClass: "bg-amber-50 text-amber-800 border-amber-200" },
  { id: "Garbage Dump", label: "Garbage Dump", color: "#dc2626", badgeClass: "bg-red-50 text-red-700 border-red-200" },
  { id: "Sewage / Drainage", label: "Sewage / Drainage", color: "#7c3aed", badgeClass: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "E-Waste", label: "E-Waste", color: "#059669", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "Hazardous / Medical", label: "Hazardous / Medical", color: "#e11d48", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
];

export function getTagStyle(tag: string): string {
  const match = COMMON_TAGS.find((t) => t.id.toLowerCase() === tag.toLowerCase() || t.label.toLowerCase() === tag.toLowerCase());
  return match?.badgeClass ?? "bg-slate-100 text-slate-700 border-slate-200";
}
