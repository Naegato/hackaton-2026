export const Colors = {
  // --- Brand ---
  primary: '#0D5EBF',       // bleu CTA (boutons, icônes actives)
  primaryHover: '#0A4FA3',
  primaryLight: '#4A9FD9',  // fond bleu de la home (Itinéraires)
  primarySurface: '#EEF4FB', // fond bleu-gris clair (Horaires, Infos trafic)

  // --- Neutres ---
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F5F7FA',
  border: '#E2E8F0',
  borderLight: '#F0F4F8',

  // --- Texte ---
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textLink: '#0D5EBF',

  // --- Sémantiques ---
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // --- Overlay / Modal ---
  overlay: 'rgba(0,0,0,0.4)',
  scrim: 'rgba(0,0,0,0.08)',
} as const;

// --- Couleurs officielles des lignes RATP / IDFM ---
export const LineColors: Record<string, string> = {
  // RER
  'A': '#E2231A',
  'B': '#4B92DB',
  'C': '#F5C400',
  'D': '#00A870',
  'E': '#BC2E86',
  'H': '#7B3F00',
  'J': '#C8A020',
  'K': '#7E7E00',
  'L': '#7E4899',
  'N': '#007A53',
  'P': '#F07800',
  'R': '#F4A0B4',
  'U': '#C00B22',
  'V': '#6E6E00',

  // Métro
  'M1':  '#F5C400',
  'M2':  '#003CA6',
  'M3':  '#9F9825',
  'M3B': '#82C8E6',
  'M4':  '#B24298',
  'M5':  '#F28E42',
  'M6':  '#83BB33',
  'M7':  '#F5A0B4',
  'M7B': '#83BB33',
  'M8':  '#CDB4D6',
  'M9':  '#CDAC37',
  'M10': '#E3A526',
  'M11': '#8D5E2A',
  'M12': '#00814F',
  'M13': '#98D4E2',
  'M14': '#680E8D',

  // Tramway
  'T1':  '#1C74BA',
  'T2':  '#C04090',
  'T3A': '#F07800',
  'T3B': '#007A53',
  'T4':  '#C8A020',
  'T5':  '#6E2082',
  'T6':  '#C8001E',
  'T7':  '#7E7E00',
  'T8':  '#007882',
  'T9':  '#6EAAD2',
  'T10': '#9FAF1E',
  'T11': '#FF7900',
  'T12': '#A01464',
  'T13': '#6E4C1E',
  'T14': '#007A78',
};

function hexLuminance(hex: string): number {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function lineTextColor(lineKey: string): string {
  const bg = LineColors[lineKey];
  if (!bg) return '#FFFFFF';
  return hexLuminance(bg) > 0.35 ? '#1A1A2E' : '#FFFFFF';
}
