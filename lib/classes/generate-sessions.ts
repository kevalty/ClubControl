const WEEKDAY_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

// CLAUDE.md §8.8: genera las fechas de sesión para las próximas N semanas
// a partir de hoy (inclusive), para los días de semana indicados.
export function generateSessionDates(days: string[], weeksAhead: number): string[] {
  const targetIndexes = new Set(days.map((d) => WEEKDAY_INDEX[d]).filter((i) => i !== undefined));
  const dates: string[] = [];
  const totalDays = weeksAhead * 7;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (targetIndexes.has(d.getDay())) {
      dates.push(d.toISOString().slice(0, 10));
    }
  }

  return dates;
}
