import { describe, expect, it } from "vitest";
import { generateSessionDates } from "@/lib/classes/generate-sessions";

describe("generateSessionDates", () => {
  it("genera una fecha por cada día de la semana indicado, para N semanas", () => {
    const dates = generateSessionDates(["mon", "wed", "fri"], 4);
    expect(dates.length).toBe(12); // 3 días x 4 semanas

    for (const iso of dates) {
      const day = new Date(`${iso}T00:00:00`).getDay();
      expect([1, 3, 5]).toContain(day);
    }
  });

  it("no genera fechas en el pasado", () => {
    const dates = generateSessionDates(["mon"], 2);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const iso of dates) {
      expect(new Date(`${iso}T00:00:00`).getTime()).toBeGreaterThanOrEqual(today.getTime());
    }
  });

  it("devuelve fechas en orden cronológico", () => {
    const dates = generateSessionDates(["mon", "thu"], 3);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });
});
