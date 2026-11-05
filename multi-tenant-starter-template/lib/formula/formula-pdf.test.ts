import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { ageAt, buildFormulaPdf, formulaNumber, safe } from "./formula-pdf";

type Formula = Parameters<typeof buildFormulaPdf>[0];

const formula = (overrides: Partial<Formula> = {}): Formula => ({
  consultationId: "3f2b1c9e-7a44-4d1b-9c2e-8a1b6f0e5d77",
  signedAt: "2026-11-04T22:02:14.000Z",
  ips: { name: "IPS de prueba", nit: null, habilitationCode: null, address: null, city: null, department: null, phone: null },
  patient: {
    fullName: "Paciente de prueba",
    document: { type: "CC", number: "1000" },
    sex: "M",
    birthDate: "2000-08-12",
    eps: null,
    regime: "particular",
  },
  physician: { displayName: "Dr. Prueba" },
  service: "Medicina General",
  diagnoses: [{ code: "J06.9", description: "Infección respiratoria aguda", principal: true }],
  prescription: [
    { medication: "Acetaminofén 500 mg", presentation: "Tableta", dose: "1 tableta", route: "oral", frequency: "cada 8 horas", durationDays: 5, quantity: 15, instructions: "" },
  ],
  ...overrides,
});

describe("ageAt", () => {
  it("counts the birthday on the day it happens in Bogotá", () => {
    // 14 March 21:00 in Bogotá is 15 March 02:00 UTC: the birthday has not happened yet.
    expect(ageAt("2000-03-15", "2026-03-15T02:00:00.000Z")).toBe(25);
    expect(ageAt("2000-03-15", "2026-03-15T06:00:00.000Z")).toBe(26);
  });
});

describe("formulaNumber", () => {
  it("uses the year in Bogotá: 31 December 20:00 is already 1 January in UTC", () => {
    expect(formulaNumber(formula({ signedAt: "2027-01-01T01:00:00.000Z" }))).toMatch(/^F-2026-/);
    expect(formulaNumber(formula({ signedAt: "2027-01-01T06:00:00.000Z" }))).toMatch(/^F-2027-/);
  });

  it("ends with the consultation id, in capitals", () => {
    expect(formulaNumber(formula())).toBe("F-2026-6F0E5D77");
  });
});

describe("safe", () => {
  it("keeps accents and turns typographic punctuation into plain characters", () => {
    expect(safe("Mañana – no más de 3 al día “con comida”")).toBe('Mañana - no más de 3 al día "con comida"');
  });

  it("replaces what the PDF font cannot draw, controls included", () => {
    expect(safe("a\u0085b\u009Fc\u0007d😀")).toBe("a?b?c?d??");
  });
});

describe("buildFormulaPdf", () => {
  it("builds a PDF even with pasted punctuation and control characters", async () => {
    const pdf = await buildFormulaPdf(
      formula({
        prescription: [
          { medication: "Acetaminofén", presentation: "Tableta", dose: "1", route: "oral", frequency: "cada 8 horas", durationDays: 5, quantity: 1, instructions: "Con comida – no más de 3\u0085 al día" },
        ],
      }),
    );
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("starts a new page rather than cutting the boxes when the list is long", async () => {
    const many = Array.from({ length: 14 }, (_, i) => ({
      medication: `Medicamento ${i + 1}`, presentation: "Tableta", dose: "1 tableta", route: "oral" as const,
      frequency: "cada 8 horas", durationDays: 7, quantity: 21, instructions: "Tomar con abundante agua y no mezclar con otros medicamentos.",
    }));
    const pdf = await buildFormulaPdf(formula({ prescription: many }));
    expect((await PDFDocument.load(pdf)).getPageCount()).toBeGreaterThan(1);
  });
});
