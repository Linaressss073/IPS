const UNITS = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece",
  "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós",
  "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const TENS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const HUNDREDS = [
  "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos",
  "ochocientos", "novecientos",
];

/** A whole number in Spanish words (0 to 999 999), as written next to quantities on prescriptions. */
export function numberInWords(n: number): string {
  if (n < 30) return UNITS[n];
  if (n < 100) return n % 10 ? `${TENS[Math.floor(n / 10)]} y ${UNITS[n % 10]}` : TENS[n / 10];
  if (n === 100) return "cien";
  if (n < 1000) return n % 100 ? `${HUNDREDS[Math.floor(n / 100)]} ${numberInWords(n % 100)}` : HUNDREDS[n / 100];
  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1000);
    const head = thousands === 1 ? "mil" : `${numberInWords(thousands)} mil`;
    return n % 1000 ? `${head} ${numberInWords(n % 1000)}` : head;
  }
  return String(n);
}
