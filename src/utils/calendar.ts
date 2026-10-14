/**
 * Calendar utilities for calculating race weekends (4 vs 5 weeks in a month)
 */

export const MONTH_CODES = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
];

export const MONTH_FULL_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Calculates the exact number of weekends in a given month of a given year.
 * A race weekend is marked by its Sunday (or Saturday if the month closes on Saturday).
 * Months have either 4 or 5 race weekends.
 */
export function getWeekendsCountInMonth(year: number, monthZeroIndexed: number): number {
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();
  let weekendCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthZeroIndexed, day);
    // Sunday (0) marks the primary race day of a weekend
    if (d.getDay() === 0) {
      weekendCount++;
    }
  }

  // If the month closes on a Saturday (6) and has not reached 5 weekends,
  // that Saturday is part of a weekend whose Sunday falls on the 1st of the next month.
  const lastDay = new Date(year, monthZeroIndexed, daysInMonth);
  if (lastDay.getDay() === 6 && weekendCount < 5) {
    weekendCount++;
  }

  return Math.min(5, Math.max(4, weekendCount));
}

/**
 * Returns a summary of weekends for all 12 months in a given year.
 */
export function getYearlyWeekendsBreakdown(year: number): {
  monthCode: string;
  monthName: string;
  weekendsCount: number;
}[] {
  return MONTH_CODES.map((code, index) => ({
    monthCode: code,
    monthName: MONTH_FULL_NAMES[index],
    weekendsCount: getWeekendsCountInMonth(year, index),
  }));
}
