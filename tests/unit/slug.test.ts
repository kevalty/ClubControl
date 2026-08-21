import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("convierte nombres de club a slugs de URL válidos", () => {
    expect(slugify("Club Deportivo Ñañez")).toBe("club-deportivo-nanez");
    expect(slugify("  Gimnasio  El Fuerte  ")).toBe("gimnasio-el-fuerte");
    expect(slugify("Box CrossFit #1 (Quito)")).toBe("box-crossfit-1-quito");
  });

  it("colapsa espacios y guiones repetidos", () => {
    expect(slugify("a   b---c")).toBe("a-b-c");
  });

  it("recorta guiones al inicio y al final", () => {
    expect(slugify("-hola-")).toBe("hola");
  });
});
