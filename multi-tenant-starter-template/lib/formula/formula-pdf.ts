import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { ROUTES } from "@/lib/api/consultation";
import type { components } from "@/lib/api/schema";
import { isFeminine, numberInWords } from "./spanish-number";

type Formula = components["schemas"]["FormulaView"];

/** The prescription is valid this many days after it is signed. */
const VALID_DAYS = 30;
const SEX: Record<Formula["patient"]["sex"], string> = { H: "Masculino", M: "Femenino", I: "Intersexual" };

const W = 595;
const H = 842;
const M = 40;
const CONTENT = W - 2 * M;
const QTY_COL = 130;

/** Typographic characters people paste from Word, as plain equivalents. */
const PUNCTUATION: Record<string, string> = {
  "‘": "'", "’": "'", "“": '"', "”": '"', "–": "-", "—": "-", "…": "...", "•": "-",
};

/** Standard PDF fonts only draw printable Latin-1: anything else (controls included) would throw or print wrong. */
export const safe = (text: string) =>
  text
    .replace(/[‘’“”–—…•]/g, (ch) => PUNCTUATION[ch])
    .replace(/[^ -~ -ÿ]/g, "?");

/** The date (YYYY-MM-DD) in Bogotá: what the patient and the printed dates see. */
const bogotaDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

const dateOf = (iso: string, time = false) =>
  new Date(iso).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(time && { hour: "2-digit", minute: "2-digit", hour12: false }),
  });

/** Whole years on the day `at` (an instant), counting that day in Bogotá. */
export const ageAt = (birthDate: string, at: string) => {
  const [year, month, day] = bogotaDate(at).split("-").map(Number);
  const [bornYear, bornMonth, bornDay] = birthDate.slice(0, 10).split("-").map(Number);
  const before = month < bornMonth || (month === bornMonth && day < bornDay);
  return year - bornYear - (before ? 1 : 0);
};

/** Number printed on the prescription: the year it was signed (in Bogotá) and the end of the consultation id. */
export const formulaNumber = (f: Formula) =>
  `F-${bogotaDate(f.signedAt).slice(0, 4)}-${f.consultationId.replace(/-/g, "").slice(-8).toUpperCase()}`;

/** The signed prescription as a PDF: IPS letterhead, patient, diagnoses, medicines and delivery boxes. */
export async function buildFormulaPdf(f: Formula): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const grey = rgb(0.45, 0.45, 0.45);
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const wrap = (text: string, width: number, size: number, face: PDFFont = font) => {
    const lines: string[] = [];
    let current = "";
    for (const word of safe(text).split(/\s+/)) {
      const next = current ? `${current} ${word}` : word;
      if (current && face.widthOfTextAtSize(next, size) > width) {
        lines.push(current);
        current = word;
      } else current = next;
    }
    return current ? [...lines, current] : lines;
  };
  const draw = (text: string, x: number, at: number, size = 9, face: PDFFont = font) =>
    page.drawText(safe(text), { x, y: at, size, font: face });
  const need = (height: number) => {
    if (y - height >= M) return;
    page = pdf.addPage([W, H]);
    y = H - M;
  };
  const rule = () => {
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: grey });
    y -= 12;
  };

  // Letterhead (left) and prescription data (right).
  const ips = f.ips;
  const left = [
    ips.name,
    ips.nit && `NIT ${ips.nit}`,
    ips.habilitationCode && `Código de habilitación ${ips.habilitationCode}`,
    ips.address,
    [ips.city, ips.department].filter(Boolean).join(" - "),
    ips.phone && `Teléfono ${ips.phone}`,
  ].filter((line): line is string => !!line);
  const right = [
    `FÓRMULA MÉDICA No. ${formulaNumber(f)}`,
    `Fecha de expedición: ${dateOf(f.signedAt, true)}`,
    `Válida hasta: ${dateOf(new Date(Date.parse(f.signedAt) + VALID_DAYS * 86_400_000).toISOString())}`,
    f.service,
  ];
  left.forEach((line, i) => draw(line, M, y - i * 12, i === 0 ? 12 : 9, i === 0 ? bold : font));
  right.forEach((line, i) => draw(line, W / 2 + 20, y - i * 12, 9, i === 0 ? bold : font));
  y -= Math.max(left.length, right.length) * 12 + 6;
  rule();

  // Patient.
  const { patient } = f;
  const patientLines = [
    `Nombre: ${patient.fullName}`,
    `Identificación: ${patient.document.type} ${patient.document.number} - Sexo: ${SEX[patient.sex]} - Edad: ${ageAt(patient.birthDate, f.signedAt)} años`,
    `Tipo de usuario: ${patient.regime.charAt(0).toUpperCase()}${patient.regime.slice(1)}${patient.eps ? ` - EPS: ${patient.eps}` : ""}`,
  ];
  patientLines.forEach((line) => {
    draw(line, M, y);
    y -= 12;
  });
  y -= 4;

  // Diagnoses.
  const diagnoses = f.diagnoses.map((d) => `${d.code} ${d.description}`).join("; ");
  for (const line of wrap(`Diagnóstico(s): ${diagnoses}`, CONTENT, 9, bold)) {
    draw(line, M, y, 9, bold);
    y -= 12;
  }
  y -= 4;

  // Medicines.
  page.drawRectangle({ x: M, y: y - 4, width: CONTENT, height: 16, color: rgb(0.88, 0.9, 0.95) });
  draw("Medicamento y prescripción", M + 4, y, 9, bold);
  draw("Cantidad total", W - M - QTY_COL + 4, y, 9, bold);
  y -= 20;
  const textWidth = CONTENT - QTY_COL - 12;
  f.prescription.forEach((item, index) => {
    const route = ROUTES[item.route ?? "oral"] ?? item.route;
    const how = `Tomar (vía ${route}) ${item.dose} ${item.frequency} por ${item.durationDays} día(s)${item.instructions ? `. ${item.instructions}` : ""}`;
    const head = wrap(`${index + 1}. ${item.medication} ${item.presentation}`, textWidth, 9, bold);
    const body = wrap(how, textWidth, 8);
    const amount = wrap(
      `${item.quantity} (${numberInWords(item.quantity, isFeminine(item.presentation))}) ${item.presentation.toLowerCase()}`,
      QTY_COL - 8,
      9,
    );
    const height = Math.max(head.length * 11 + body.length * 10, amount.length * 11) + 14;
    need(height);
    head.forEach((line, i) => draw(line, M + 4, y - 8 - i * 11, 9, bold));
    body.forEach((line, i) => draw(line, M + 4, y - 8 - head.length * 11 - i * 10, 8));
    amount.forEach((line, i) => draw(line, W - M - QTY_COL + 4, y - 8 - i * 11));
    y -= height;
    page.drawLine({ start: { x: M, y: y + 2 }, end: { x: W - M, y: y + 2 }, thickness: 0.3, color: grey });
  });
  y -= 10;

  // Notices and the two boxes stay together on one page (about 40 + 14 + 82 points, with margin).
  need(170);
  [
    "Los medicamentos únicamente deben ser administrados durante el tiempo definido en la formulación.",
    `FÓRMULA MÉDICA VÁLIDA POR ${VALID_DAYS} DÍAS A PARTIR DE LA FECHA DE EXPEDICIÓN.`,
    "Reclame sus medicamentos dentro del tiempo establecido; de lo contrario podría requerir una nueva valoración médica.",
  ].forEach((notice, i) =>
    wrap(notice, CONTENT, 8, i === 1 ? bold : font).forEach((line) => {
      draw(line, M, y, 8, i === 1 ? bold : font);
      y -= 10;
    }),
  );
  y -= 14;

  // Physician and delivery boxes.
  const box = (x: number, width: number, title: string, lines: string[]) => {
    const heading = wrap(title, width - 12, 8, bold);
    page.drawRectangle({ x, y: y - 82, width, height: 82, borderWidth: 0.6, borderColor: grey });
    heading.forEach((line, i) => draw(line, x + 6, y - 12 - i * 10, 8, bold));
    const first = 18 + heading.length * 10;
    lines.forEach((line, i) => draw(line, x + 6, y - first - i * 16, 8));
  };
  const half = (CONTENT - 10) / 2;
  box(M, half, "MÉDICO", [
    f.physician.displayName,
    f.service,
    "Firmado electrónicamente",
    `Fecha: ${dateOf(f.signedAt, true)}`,
  ]);
  box(M + half + 10, half, "DATOS DE LA ENTREGA DE LA FÓRMULA MÉDICA AL PACIENTE", [
    "Fecha de entrega (DD/MM/AAAA): ______________",
    "Entidad proveedora: ____________________",
    "Firma del paciente: ____________________",
  ]);

  return pdf.save();
}
