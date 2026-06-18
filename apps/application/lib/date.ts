/**
 * Helpers de date de naissance (saisie masquée JJ/MM/AAAA ↔ ISO AAAA-MM-JJ).
 * On stocke en ISO côté API (préférences, éligibilité) et on affiche/saisit en JJ/MM/AAAA.
 */

/** "12031990" ou "12/03/1990" → "12/03/1990" (masque JJ/MM/AAAA, 8 chiffres max). */
export function maskFrDate(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean);
  return parts.join('/');
}

/** "JJ/MM/AAAA" → Date réelle (jour existant) ou null. */
export function parseFrDate(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(year, month - 1, day);
  // Rejette les dates qui « débordent » (ex. 31/02) — JS les recale silencieusement
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return dt;
}

/** "JJ/MM/AAAA" → "AAAA-MM-JJ" (ISO) ou null si invalide. */
export function frDateToIso(s: string): string | null {
  const dt = parseFrDate(s);
  if (!dt) return null;
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

/** ISO (ou date parsable) → "JJ/MM/AAAA" (chaîne vide si invalide). */
export function isoToFrDate(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

/** Âge exact (années révolues) à partir d'une date ISO, ou null. */
export function ageFromIso(iso: string): number | null {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dt.getFullYear();
  const m = now.getMonth() - dt.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dt.getDate())) age--;
  return age;
}
