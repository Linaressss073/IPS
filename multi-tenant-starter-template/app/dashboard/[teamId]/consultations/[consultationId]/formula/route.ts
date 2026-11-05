import { auth } from "@clerk/nextjs/server";
import { API_BASE } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { buildFormulaPdf, formulaNumber } from "@/lib/formula/formula-pdf";

type Params = { params: Promise<{ teamId: string; consultationId: string }> };

/**
 * BFF: the signed prescription as a PDF. Gets the data from the API with the
 * caller's session token (it carries the IPS in the URL) and builds the PDF here.
 */
export async function GET(_request: Request, { params }: Params) {
  const { teamId, consultationId } = await params;
  const token = await (await auth()).getToken();
  if (!token) return Response.json({ message: "No ha iniciado sesión" }, { status: 401 });

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE}/teams/${encodeURIComponent(teamId)}/consultations/${encodeURIComponent(consultationId)}/formula`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
  } catch {
    return Response.json({ message: "No se pudo contactar la API" }, { status: 502 });
  }
  if (!response.ok) return new Response(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });

  const formula = (await response.json()) as components["schemas"]["FormulaView"];
  const pdf = await buildFormulaPdf(formula);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="formula-${formulaNumber(formula)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
