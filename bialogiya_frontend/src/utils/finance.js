import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

export const formatSum = (value) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(value || 0))} so'm`;

export const formatCompactSum = (value) => {
  const n = Math.round(value || 0);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mln`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} ming`;
  return String(n);
};

export const formatMonth = (month) => {
  if (!month) return '';
  const [year, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('uz-UZ', { month: 'short', year: '2-digit' })
    .format(new Date(year, m - 1, 1));
};

export const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Ijara' },
  { value: 'utilities', label: 'Kommunal' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'equipment', label: 'Jihozlar' },
  { value: 'salary', label: 'Ish haqi' },
  { value: 'tax', label: 'Soliq' },
  { value: 'other', label: 'Boshqa' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Naqd' },
  { value: 'click', label: 'Click' },
  { value: 'payme', label: 'Payme' },
  { value: 'bank', label: 'Bank o\'tkazma' },
  { value: 'other', label: 'Boshqa' },
];

export const categoryLabel = (value) =>
  EXPENSE_CATEGORIES.find(c => c.value === value)?.label || value;

export const methodLabel = (value) =>
  PAYMENT_METHODS.find(m => m.value === value)?.label || value;

// Series colours are mode-specific steps, not an automatic flip: each pair was
// checked for colour-blind separation and contrast against its own surface.
const SERIES = {
  light: { income: '#00BFA6', expense: '#F97316', profit: '#0099FF' },
  dark: { income: '#009985', expense: '#EA580C', profit: '#007ACC' },
};

/**
 * Builds and downloads an .xlsx report of the finance dashboard for the
 * selected month: monthly summary, expense categories, income methods and
 * top-earning groups, each on its own sheet.
 */
export function exportFinanceToExcel({ month, summary, expenseRows, incomeByMethod, topGroups }) {
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet([
    { Ko_rsatkich: 'Oy', Qiymat: formatMonth(month) },
    { Ko_rsatkich: 'Tushum', Qiymat: summary?.current?.income || 0 },
    { Ko_rsatkich: 'Xarajat', Qiymat: summary?.current?.expense || 0 },
    { Ko_rsatkich: (summary?.current?.profit ?? 0) >= 0 ? 'Sof foyda' : 'Zarar', Qiymat: Math.abs(summary?.current?.profit || 0) },
    { Ko_rsatkich: "Yig'ilmagan qarz", Qiymat: summary?.outstanding || 0 },
  ], { header: ['Ko_rsatkich', 'Qiymat'] });
  XLSX.utils.sheet_add_aoa(summarySheet, [['Ko\'rsatkich', 'Qiymat']], { origin: 'A1' });
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Umumiy');

  const expenseSheet = XLSX.utils.json_to_sheet(
    (expenseRows || []).map((r) => ({ Toifa: r.label, Summa: r.amount })),
  );
  XLSX.utils.book_append_sheet(wb, expenseSheet, 'Xarajat toifalari');

  const incomeSheet = XLSX.utils.json_to_sheet(
    Object.entries(incomeByMethod || {}).map(([method, amount]) => ({ Turi: methodLabel(method), Summa: amount })),
  );
  XLSX.utils.book_append_sheet(wb, incomeSheet, 'Tushum turlari');

  const groupsSheet = XLSX.utils.json_to_sheet(
    (topGroups || []).map((g) => ({
      Guruh: g.name,
      "O'qituvchi": g.teacher?.name || '',
      "O'quvchilar": g.activeCount,
      Tushum: g.collected,
      'Markaz ulushi': g.centerNet,
      Qarz: g.debt || 0,
      "Yig'ish foizi (%)": g.collectionRate,
    })),
  );
  XLSX.utils.book_append_sheet(wb, groupsSheet, 'Guruhlar');

  XLSX.writeFile(wb, `hisob-kitob-${month}.xlsx`);
}

export function useChartColors() {
  const read = () => (document.documentElement.classList.contains('dark') ? SERIES.dark : SERIES.light);
  const [colors, setColors] = useState(read);

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return colors;
}
