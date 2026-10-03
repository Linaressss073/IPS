/**
 * Frequent outpatient diagnoses (CIE-10) to search by code or name. Not the
 * full catalog: any well-formed code can also be typed by hand.
 */
export const CIE10_COMMON: { code: string; description: string }[] = [
  { code: "A09", description: "Diarrea y gastroenteritis de presunto origen infeccioso" },
  { code: "B34.9", description: "Infección viral, no especificada" },
  { code: "B86", description: "Escabiosis" },
  { code: "D50.9", description: "Anemia por deficiencia de hierro, sin otra especificación" },
  { code: "E03.9", description: "Hipotiroidismo, no especificado" },
  { code: "E11.9", description: "Diabetes mellitus tipo 2, sin complicaciones" },
  { code: "E66.9", description: "Obesidad, no especificada" },
  { code: "E78.5", description: "Hiperlipidemia, no especificada" },
  { code: "F32.9", description: "Episodio depresivo, no especificado" },
  { code: "F41.1", description: "Trastorno de ansiedad generalizada" },
  { code: "G43.9", description: "Migraña, no especificada" },
  { code: "H10.9", description: "Conjuntivitis, no especificada" },
  { code: "I10", description: "Hipertensión esencial (primaria)" },
  { code: "J00", description: "Rinofaringitis aguda (resfriado común)" },
  { code: "J02.9", description: "Faringitis aguda, no especificada" },
  { code: "J03.9", description: "Amigdalitis aguda, no especificada" },
  { code: "J06.9", description: "Infección aguda de las vías respiratorias superiores, no especificada" },
  { code: "J30.4", description: "Rinitis alérgica, no especificada" },
  { code: "J45.9", description: "Asma, no especificada" },
  { code: "K21.9", description: "Enfermedad del reflujo gastroesofágico sin esofagitis" },
  { code: "K29.7", description: "Gastritis, no especificada" },
  { code: "K59.0", description: "Constipación" },
  { code: "L30.9", description: "Dermatitis, no especificada" },
  { code: "L70.0", description: "Acné vulgar" },
  { code: "M17.9", description: "Gonartrosis, no especificada" },
  { code: "M25.5", description: "Dolor en articulación" },
  { code: "M54.5", description: "Lumbago no especificado" },
  { code: "M79.1", description: "Mialgia" },
  { code: "N39.0", description: "Infección de vías urinarias, sitio no especificado" },
  { code: "N76.0", description: "Vaginitis aguda" },
  { code: "R05", description: "Tos" },
  { code: "R10.4", description: "Otros dolores abdominales y los no especificados" },
  { code: "R42", description: "Mareo y desvanecimiento" },
  { code: "R50.9", description: "Fiebre, no especificada" },
  { code: "R51", description: "Cefalea" },
  { code: "S93.4", description: "Esguince y torcedura del tobillo" },
  { code: "Z00.0", description: "Examen médico general" },
  { code: "Z30.0", description: "Consejo y asesoramiento general sobre la anticoncepción" },
  { code: "Z34.9", description: "Supervisión de embarazo normal, no especificado" },
];

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Matches by code prefix or by every word of the description. */
export function searchCie10(query: string, limit = 8) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return CIE10_COMMON.filter((entry) => {
    const code = entry.code.toLowerCase();
    const description = normalize(entry.description);
    return words.every((word) => code.startsWith(word) || description.includes(word));
  }).slice(0, limit);
}

export const CIE10_PATTERN = /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,2})?$/;
