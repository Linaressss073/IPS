import { describe, expect, it } from "vitest";
import { isFeminine, numberInWords } from "./spanish-number";

describe("numberInWords", () => {
  it.each([
    [0, "cero"],
    [15, "quince"],
    [20, "veinte"],
    [30, "treinta"],
    [42, "cuarenta y dos"],
    [100, "cien"],
    [101, "ciento un"],
    [999, "novecientos noventa y nueve"],
    [1000, "mil"],
    [1001, "mil un"],
    [21_000, "veintiún mil"],
    [31_000, "treinta y un mil"],
    [200_000, "doscientos mil"],
  ])("%i in masculine", (n, text) => expect(numberInWords(n)).toBe(text));

  it.each([
    [1, "una"],
    [21, "veintiuna"],
    [31, "treinta y una"],
    [200, "doscientas"],
    [501, "quinientas una"],
  ])("%i in feminine", (n, text) => expect(numberInWords(n, true)).toBe(text));

  it("agrees with the unit of a prescription line", () => {
    expect(numberInWords(1, isFeminine("Tableta"))).toBe("una");
    expect(numberInWords(1, isFeminine("Frasco"))).toBe("un");
    expect(numberInWords(20, isFeminine("Tableta"))).toBe("veinte");
  });
});

describe("isFeminine", () => {
  it("reads the gender from the first word of the presentation", () => {
    expect(isFeminine("Tableta recubierta")).toBe(true);
    expect(isFeminine("Solución inyectable")).toBe(true);
    expect(isFeminine("Cápsula blanda")).toBe(true);
    expect(isFeminine("Jarabe")).toBe(false);
    expect(isFeminine("Frasco x 120 ml")).toBe(false);
  });
});
