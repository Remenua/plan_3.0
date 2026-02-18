import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronDown, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export function formatDateISOToRU(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

export function statusLabel(approved: boolean): 'Согласован' | 'Черновик' {
  return approved ? 'Согласован' : 'Черновик';
}

type ReportType = 'ПиУ' | 'ДДС';

type Plan = {
  id: number;
  name: string;
  author: string;
  approved: boolean;
  createdAt: string;
  report: ReportType;
  note: string;
  attachmentName?: string;
};

type View = 'list' | 'card' | 'values';

const TODAY_ISO = '2026-02-12';
const CURRENT_USER = 'Сухачев Никита';

const ui = {
  page: 'bg-white min-h-screen',
  wrap: 'max-w-[860px] mx-auto px-6 md:px-10 py-8',

  close: 'text-sm text-gray-500 hover:text-gray-700',
  hint: 'text-sm text-gray-400',

  btnSecondary: 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50',
  btnPrimary: 'bg-amber-400 text-gray-900 hover:bg-amber-300',

  iconBtn:
    'w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 inline-flex items-center justify-center',

  pillBtn:
    'h-7 px-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs truncate',

  label: 'text-sm font-semibold text-gray-900',
  underlineInput:
    'mt-2 h-10 rounded-none border-0 border-b border-gray-200 px-0 focus-visible:ring-0 focus-visible:ring-offset-0',
  underlineTextarea:
    'mt-2 w-full min-h-[120px] rounded-none border-0 border-b border-gray-200 px-0 py-2 text-sm outline-none',

  bottomBar: 'fixed bottom-0 left-0 right-0 bg-white border-t',
  bottomInner: 'max-w-[860px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between',
} as const;

type PeriodKey = string;
type PeriodColumn = { key: PeriodKey; label: string };
type TableStep = 'day' | 'week' | 'month';
type QuickPeriodPreset = '7d' | '14d' | '30d' | '4w' | '8w' | '12w' | '3m' | '6m' | '12m';

const MONTH_COLUMNS: PeriodColumn[] = [
  { key: 'Jan', label: 'Янв' },
  { key: 'Feb', label: 'Фев' },
  { key: 'Mar', label: 'Мар' },
  { key: 'Apr', label: 'Апр' },
  { key: 'May', label: 'Май' },
  { key: 'Jun', label: 'Июн' },
  { key: 'Jul', label: 'Июл' },
  { key: 'Aug', label: 'Авг' },
  { key: 'Sep', label: 'Сен' },
  { key: 'Oct', label: 'Окт' },
  { key: 'Nov', label: 'Ноя' },
  { key: 'Dec', label: 'Дек' },
];

const STEP_OPTIONS: { key: TableStep; label: string }[] = [
  { key: 'day', label: 'День' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
];

const QUICK_PERIOD_OPTIONS_BY_STEP: Record<TableStep, { key: QuickPeriodPreset; label: string; amount: number }[]> = {
  day: [
    { key: '7d', label: '7 дней', amount: 7 },
    { key: '14d', label: '14 дней', amount: 14 },
    { key: '30d', label: '30 дней', amount: 30 },
  ],
  week: [
    { key: '4w', label: '4 недели', amount: 4 },
    { key: '8w', label: '8 недель', amount: 8 },
    { key: '12w', label: '12 недель', amount: 12 },
  ],
  month: [
    { key: '3m', label: '3 месяца', amount: 3 },
    { key: '6m', label: '6 месяцев', amount: 6 },
    { key: '12m', label: '12 месяцев', amount: 12 },
  ],
};

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function monthLabel(date: Date): string {
  return date.toLocaleString('ru-RU', { month: 'short' }).replace('.', '');
}

function buildPeriodColumns(step: TableStep, fromISO: string, toISOValue: string): PeriodColumn[] {
  const from = parseISO(fromISO);
  const to = parseISO(toISOValue);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return MONTH_COLUMNS;

  const cols: PeriodColumn[] = [];
  if (step === 'day') {
    let i = 0;
    for (let d = new Date(from); d <= to && i < 370; d = addDays(d, 1), i += 1) {
      cols.push({ key: toISO(d), label: `${d.getDate()}.${d.getMonth() + 1}` });
    }
    return cols;
  }

  if (step === 'week') {
    let idx = 1;
    for (let d = new Date(from); d <= to && idx <= 104; d = addDays(d, 7), idx += 1) {
      cols.push({ key: toISO(d), label: `Н${idx}` });
    }
    return cols;
  }

  let idx = 0;
  for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= to && idx < 24; d = addMonths(d, 1), idx += 1) {
    const label = `${monthLabel(d).charAt(0).toUpperCase()}${monthLabel(d).slice(1)}`;
    cols.push({ key: `M-${d.getFullYear()}-${d.getMonth() + 1}`, label });
  }
  return cols.length ? cols : MONTH_COLUMNS;
}

type AnalyticKey = 'Проект' | 'Номенклатура' | 'Организация' | 'ЦФО';
const ANALYTICS: AnalyticKey[] = ['Проект', 'Организация', 'ЦФО', 'Номенклатура'];

const ANALYTIC_VALUES: Record<AnalyticKey, string[]> = {
  Проект: ['Проект A', 'Проект B', 'Проект C'],
  Организация: ['ООО Ромашка', 'ООО Василек'],
  ЦФО: ['Продажи', 'Маркетинг', 'Администрация'],
  Номенклатура: ['SKU-1', 'SKU-2', 'SKU-3'],
};

type Breakdown = {
  analytics: AnalyticKey[];
  valuesMode: 'all' | 'selected';
  selectedValues: Partial<Record<AnalyticKey, string[]>>;
};

type BreakdownTarget =
  | { scope: 'План' }
  | { scope: 'Раздел'; sectionId: number }
  | { scope: 'Статья'; sectionId: number; lineId: number };

type ComboRow = {
  id: number;
  dims: Partial<Record<AnalyticKey, string>>;
  values: Record<PeriodKey, string>;
};

type ArticleLine = {
  id: number;
  name: string;
  values: Record<PeriodKey, string>;
  breakdown?: Breakdown;
  combos: ComboRow[];
  isOpen?: boolean;
};

type Section = {
  id: number;
  name: string;
  isOpen: boolean;
  lines: ArticleLine[];
  breakdown?: Breakdown;
};

const makeId = () => Date.now() + Math.floor(Math.random() * 10_000);

function emptyValues(): Record<PeriodKey, string> {
  const out = {} as Record<PeriodKey, string>;
  for (const p of MONTH_COLUMNS) out[p.key] = '';
  return out;
}

function parseCell(v: string): number {
  const n = parseFloat((v ?? '').toString().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function sumLine(values: Record<PeriodKey, string>, columns: PeriodColumn[]): number {
  return columns.reduce((acc, p) => acc + parseCell(values[p.key] ?? ''), 0);
}

function defaultBreakdown(): Breakdown {
  return { analytics: [], valuesMode: 'all', selectedValues: {} };
}

function formatBreakdownLabel(b?: Breakdown): string {
  if (!b || b.analytics.length === 0) return 'Разрезы: Общий';
  return `Разрезы: ${b.analytics.join(' → ')}`;
}

function makeLine(name: string): ArticleLine {
  return { id: makeId(), name, values: emptyValues(), combos: [], isOpen: true };
}

function makeSection(id: number, name: string, isOpen = true, lines: ArticleLine[] = []): Section {
  return { id, name, isOpen, lines };
}

const SECTION_CATALOG: Record<ReportType, Record<string, string[]>> = {
  ПиУ: {
    Выручка: [
      'Выручка маркетплейсы',
      'Выручка опт',
      'Выручка розница',
      'Выручка B2B контракты',
      'Выручка экспорт',
      'Выручка подписки',
      'Прочая выручка',
    ],
    Себестоимость: [
      'Закупка товара',
      'Сырье и материалы',
      'Комиссии маркетплейсов',
      'Логистика',
      'Складские услуги',
      'Упаковка',
      'Производственный брак',
    ],
    'Коммерческие расходы': [
      'Маркетинг',
      'Реклама performance',
      'Доставка клиенту',
      'Комиссии эквайринга',
      'Сервис/гарантия',
      'Бонусы клиентам',
    ],
    'Управленческие расходы': [
      'Аренда',
      'ФОТ админ',
      'ИТ/сервисы',
      'Юридические услуги',
      'Бухгалтерия и аудит',
      'Связь и интернет',
      'Командировки',
    ],
    'Чистая прибыль': [],
  },
  ДДС: {
    Поступления: [
      'Поступления от продаж',
      'Поступления от маркетплейсов',
      'Погашение дебиторки',
      'Займы полученные',
      'Возвраты/прочие поступления',
    ],
    Выплаты: [
      'Оплата поставщикам',
      'ФОТ',
      'Налоги',
      'Аренда',
      'Маркетинг',
      'Лизинг/кредиты',
      'Капитальные затраты',
      'Прочие операционные выплаты',
    ],
    'Чистый денежный поток': ['Операционный денежный поток', 'Инвестиционный денежный поток', 'Финансовый денежный поток'],
    'Остаток на начало': ['Остаток на расчетных счетах', 'Остаток в кассе'],
    'Остаток на конец': ['Остаток на расчетных счетах', 'Остаток в кассе'],
  },
};

function getAddableArticles(report: ReportType, sectionName: string, existing: string[]): string[] {
  const all = SECTION_CATALOG[report][sectionName] ?? [];
  const set = new Set(existing.map((x) => x.toLowerCase()));
  return all.filter((x) => !set.has(x.toLowerCase()));
}

function defaultSections(report: ReportType): Section[] {
  if (report === 'ПиУ') {
    return [
      makeSection(1, 'Выручка', true, [makeLine('Выручка маркетплейсы'), makeLine('Выручка опт')]),
      makeSection(2, 'Себестоимость', true, [makeLine('Закупка товара'), makeLine('Комиссии маркетплейсов')]),
      makeSection(3, 'Коммерческие расходы', true, []),
      makeSection(4, 'Управленческие расходы', true, []),
      makeSection(5, 'Чистая прибыль', true, []),
    ];
  }
  return [
    makeSection(101, 'Поступления', true, []),
    makeSection(102, 'Выплаты', true, []),
    makeSection(103, 'Чистый денежный поток', true, []),
    makeSection(104, 'Остаток на начало', true, []),
    makeSection(105, 'Остаток на конец', true, []),
  ];
}

function sumSectionByPeriod(section: Section, columns: PeriodColumn[], planB?: Breakdown): Record<PeriodKey, number> {
  const out = {} as Record<PeriodKey, number>;
  for (const p of columns) {
    out[p.key] = section.lines.reduce((s, ln) => {
      const eff = ln.breakdown ?? section.breakdown ?? planB;
      if (eff?.analytics.length) return s + ln.combos.reduce((ss, row) => ss + parseCell(row.values[p.key]), 0);
      return s + parseCell(ln.values[p.key]);
    }, 0);
  }
  return out;
}

function sumSectionTotal(section: Section, columns: PeriodColumn[], planB?: Breakdown): number {
  return section.lines.reduce((acc, ln) => {
    const eff = ln.breakdown ?? section.breakdown ?? planB;
    if (eff?.analytics.length) return acc + ln.combos.reduce((s, c) => s + sumLine(c.values, columns), 0);
    return acc + sumLine(ln.values, columns);
  }, 0);
}

type AddArticlesDialogState = {
  open: boolean;
  sectionId: number | null;
  selected: Record<string, boolean>;
};

type BreakdownDialogState = {
  open: boolean;
  target: BreakdownTarget | null;
  applyTo: 'only' | 'section';
  analytics: AnalyticKey[];
  valuesMode: 'all' | 'selected';
  selectedValues: Partial<Record<AnalyticKey, Record<string, boolean>>>;
};


type DeleteLineDialogState = {
  open: boolean;
  sectionId: number | null;
  lineId: number | null;
  lineName: string;
};

(function runSanityChecks() {
  const t1 = formatDateISOToRU('2026-02-12') === '12.02.2026';
  const t2 = statusLabel(true) === 'Согласован' && statusLabel(false) === 'Черновик';
  const t3 = parseCell('1,5') === 1.5 && parseCell('abc') === 0;
  const t4 = sumLine({ ...emptyValues(), Jan: '10', Feb: '5' }, MONTH_COLUMNS) === 15;
  const t5 = formatBreakdownLabel({ analytics: ['Проект'], valuesMode: 'all', selectedValues: {} }).includes('Проект');
  const t6 = getAddableArticles('ПиУ', 'Выручка', ['Выручка опт']).includes('Выручка маркетплейсы');
  const t7 = !getAddableArticles('ПиУ', 'Выручка', ['Выручка маркетплейсы']).includes('Выручка маркетплейсы');

  if (!t1 || !t2 || !t3 || !t4 || !t5 || !t6 || !t7) {
    console.warn('Sanity checks failed', { t1, t2, t3, t4, t5, t6, t7 });
  }
})();

function Pill({
  text,
  onClick,
  title,
  className,
  hidden,
}: {
  text: string;
  onClick: () => void;
  title?: string;
  className?: string;
  hidden?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${ui.pillBtn} ${className ?? ''} ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`.trim()}
      onClick={onClick}
      title={title}
      aria-label={title ?? text}
    >
      {text}
    </button>
  );
}

function IconPlusButton({
  onClick,
  title,
  hidden,
}: {
  onClick: () => void;
  title?: string;
  hidden?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${ui.iconBtn} ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      onClick={onClick}
      title={title}
      aria-label={title ?? 'Добавить'}
    >
      <Plus size={16} />
    </button>
  );
}

function getBreakdownAnalytics(b?: Breakdown): AnalyticKey[] {
  return b?.analytics?.length ? b.analytics : [];
}

function uniqAnalytics(list: AnalyticKey[]): AnalyticKey[] {
  const out: AnalyticKey[] = [];
  const seen = new Set<string>();
  for (const k of list) {
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

export default function PlanningPrototype() {
  const [view, setView] = useState<View>('list');
  const [tableStep, setTableStep] = useState<TableStep>('month');
  const [quickPreset, setQuickPreset] = useState<QuickPeriodPreset>('12m');
  const [periodFrom, setPeriodFrom] = useState<string>('2026-01-01');
  const [periodTo, setPeriodTo] = useState<string>('2026-12-31');
  const periodColumns = useMemo(() => buildPeriodColumns(tableStep, periodFrom, periodTo), [tableStep, periodFrom, periodTo]);
  const [editingCell, setEditingCell] = useState<{ sectionId: number; lineId: number; comboId?: number; key: PeriodKey } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState<boolean>(false);

  const [plans, setPlans] = useState<Plan[]>([
    {
      id: 1,
      name: 'План продаж',
      author: CURRENT_USER,
      approved: false,
      createdAt: '2026-02-12',
      report: 'ПиУ',
      note: '',
    },
    {
      id: 2,
      name: 'План маркетинга',
      author: CURRENT_USER,
      approved: true,
      createdAt: '2026-02-10',
      report: 'ДДС',
      note: 'Собран на основе Q1 гипотез',
      attachmentName: 'marketing_budget.xlsx',
    },
  ]);

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [linkInput, setLinkInput] = useState<string>('');

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const [gridByPlanId, setGridByPlanId] = useState<Record<number, Section[]>>({});
  const [planBreakdownByPlanId, setPlanBreakdownByPlanId] = useState<Record<number, Breakdown>>({});

  const planId = selectedPlanId ?? -1;
  const sections = gridByPlanId[planId] ?? [];
  const planBreakdown = planBreakdownByPlanId[planId] ?? defaultBreakdown();

  const ensurePlanState = (id: number, report: ReportType) => {
    setGridByPlanId((prev) => (prev[id] ? prev : { ...prev, [id]: defaultSections(report) }));
    setPlanBreakdownByPlanId((prev) => (prev[id] ? prev : { ...prev, [id]: defaultBreakdown() }));
  };

  const updateGrid = (id: number, fn: (current: Section[]) => Section[]) => {
    setGridByPlanId((prev) => ({ ...prev, [id]: fn(prev[id] ?? []) }));
  };

  const patchPlan = (id: number, patch: Partial<Plan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (patch.report) {
      setGridByPlanId((prev) => ({ ...prev, [id]: defaultSections(patch.report as ReportType) }));
      setPlanBreakdownByPlanId((prev) => ({ ...prev, [id]: defaultBreakdown() }));
    }
  };

  const setApproved = (id: number, approved: boolean) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, approved } : p)));
  };

  const addPlan = () => {
    const next: Plan = {
      id: makeId(),
      name: 'Новый план',
      author: CURRENT_USER,
      approved: false,
      createdAt: TODAY_ISO,
      report: 'ПиУ',
      note: '',
    };
    setPlans((prev) => [next, ...prev]);
    setSelectedPlanId(next.id);
    setView('card');
  };

  const openCard = (id: number) => {
    setSelectedPlanId(id);
    setView('card');
  };

  const closeCard = () => {
    setView('list');
    setLinkInput('');
  };

  const applyQuickPreset = (step: TableStep, preset: QuickPeriodPreset) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (step === 'day') {
      const amount = QUICK_PERIOD_OPTIONS_BY_STEP.day.find((x) => x.key === preset)?.amount ?? 30;
      setPeriodFrom(toISO(start));
      setPeriodTo(toISO(addDays(start, amount - 1)));
      return;
    }

    if (step === 'week') {
      const amount = QUICK_PERIOD_OPTIONS_BY_STEP.week.find((x) => x.key === preset)?.amount ?? 12;
      setPeriodFrom(toISO(start));
      setPeriodTo(toISO(addDays(start, amount * 7 - 1)));
      return;
    }

    const amount = QUICK_PERIOD_OPTIONS_BY_STEP.month.find((x) => x.key === preset)?.amount ?? 12;
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEndExclusive = addMonths(monthStart, amount);
    setPeriodFrom(toISO(monthStart));
    setPeriodTo(toISO(addDays(monthEndExclusive, -1)));
  };

  const openValues = () => {
    if (!selectedPlan) return;
    ensurePlanState(selectedPlan.id, selectedPlan.report);
    setView('values');
  };

  const [hoverSectionId, setHoverSectionId] = useState<number | null>(null);
  const [hoverLineKey, setHoverLineKey] = useState<string | null>(null);

  const toggleSection = (sectionId: number) => {
    if (!selectedPlan) return;
    updateGrid(selectedPlan.id, (cur) => cur.map((s) => (s.id === sectionId ? { ...s, isOpen: !s.isOpen } : s)));
  };

  const toggleLine = (sectionId: number, lineId: number) => {
    if (!selectedPlan) return;
    updateGrid(selectedPlan.id, (cur) =>
      cur.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, lines: s.lines.map((ln) => (ln.id === lineId ? { ...ln, isOpen: !ln.isOpen } : ln)) };
      }),
    );
  };

  const setCell = (sectionId: number, lineId: number, key: PeriodKey, value: string) => {
    if (!selectedPlan) return;
    updateGrid(selectedPlan.id, (cur) =>
      cur.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              lines: s.lines.map((ln) => (ln.id === lineId ? { ...ln, values: { ...ln.values, [key]: value } } : ln)),
            },
      ),
    );
  };

  const setComboCell = (sectionId: number, lineId: number, comboId: number, key: PeriodKey, value: string) => {
    if (!selectedPlan) return;
    updateGrid(selectedPlan.id, (cur) =>
      cur.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          lines: s.lines.map((ln) => {
            if (ln.id !== lineId) return ln;
            return {
              ...ln,
              combos: ln.combos.map((c) => (c.id === comboId ? { ...c, values: { ...c.values, [key]: value } } : c)),
            };
          }),
        };
      }),
    );
  };

  const effLineB = (s: Section, ln: ArticleLine): Breakdown => ln.breakdown ?? s.breakdown ?? planBreakdown;

  const lineTotalsByPeriod = (s: Section, ln: ArticleLine): Record<PeriodKey, number> => {
    const eff = effLineB(s, ln);
    const out = {} as Record<PeriodKey, number>;
    for (const p of periodColumns) {
      out[p.key] = eff.analytics.length
        ? ln.combos.reduce((acc, c) => acc + parseCell(c.values[p.key]), 0)
        : parseCell(ln.values[p.key]);
    }
    return out;
  };

  const lineTotal = (s: Section, ln: ArticleLine): number => {
    const eff = effLineB(s, ln);
    return eff.analytics.length ? ln.combos.reduce((acc, c) => acc + sumLine(c.values, periodColumns), 0) : sumLine(ln.values, periodColumns);
  };

  const [addDlg, setAddDlg] = useState<AddArticlesDialogState>({ open: false, sectionId: null, selected: {} });

  const openAddDialog = (sectionId: number) => {
    if (!selectedPlan) return;
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;

    const addable = getAddableArticles(selectedPlan.report, sec.name, sec.lines.map((l) => l.name));
    const selected: Record<string, boolean> = {};
    for (const a of addable) selected[a] = false;

    setAddDlg({ open: true, sectionId, selected });
  };

  const closeAddDialog = () => setAddDlg({ open: false, sectionId: null, selected: {} });

  const toggleDlgItem = (name: string) => setAddDlg((p) => ({ ...p, selected: { ...p.selected, [name]: !p.selected[name] } }));

  const selectAllDlg = (value: boolean) =>
    setAddDlg((p) => {
      const next: Record<string, boolean> = {};
      for (const k of Object.keys(p.selected)) next[k] = value;
      return { ...p, selected: next };
    });

  const applyAddDialog = () => {
    if (!selectedPlan || !addDlg.sectionId) return;
    const namesToAdd = Object.entries(addDlg.selected)
      .filter(([, v]) => v)
      .map(([k]) => k);

    updateGrid(selectedPlan.id, (cur) =>
      cur.map((s) => {
        if (s.id !== addDlg.sectionId) return s;
        const existing = new Set(s.lines.map((l) => l.name.toLowerCase()));
        const newLines = namesToAdd.filter((n) => !existing.has(n.toLowerCase())).map(makeLine);
        return { ...s, isOpen: true, lines: [...s.lines, ...newLines] };
      }),
    );

    closeAddDialog();
  };

  const dialogSection = useMemo(() => {
    if (!addDlg.open || !addDlg.sectionId) return null;
    return sections.find((s) => s.id === addDlg.sectionId) ?? null;
  }, [addDlg.open, addDlg.sectionId, sections]);

  const dialogAddableCount = useMemo(() => Object.keys(addDlg.selected).length, [addDlg.selected]);
  const dialogSelectedCount = useMemo(() => Object.values(addDlg.selected).filter(Boolean).length, [addDlg.selected]);


  const [deleteDlg, setDeleteDlg] = useState<DeleteLineDialogState>({
    open: false,
    sectionId: null,
    lineId: null,
    lineName: '',
  });

  const openDeleteLineDialog = (sectionId: number, lineId: number, lineName: string) => {
    setDeleteDlg({ open: true, sectionId, lineId, lineName });
  };

  const closeDeleteLineDialog = () => {
    setDeleteDlg({ open: false, sectionId: null, lineId: null, lineName: '' });
  };

  const confirmDeleteLine = () => {
    if (!selectedPlan || !deleteDlg.sectionId || !deleteDlg.lineId) return;

    updateGrid(selectedPlan.id, (cur) =>
      cur.map((sct) => {
        if (sct.id !== deleteDlg.sectionId) return sct;
        return { ...sct, lines: sct.lines.filter((ln) => ln.id !== deleteDlg.lineId) };
      }),
    );

    closeDeleteLineDialog();
  };

  const [bdg, setBdg] = useState<BreakdownDialogState>({
    open: false,
    target: null,
    applyTo: 'only',
    analytics: [],
    valuesMode: 'all',
    selectedValues: {},
  });

  const closeBreakdownPanel = () => setBdg((p) => ({ ...p, open: false, target: null }));

  const openBreakdownPanel = (target: BreakdownTarget) => {
    if (!selectedPlan) return;

    const currentPlanB = planBreakdownByPlanId[selectedPlan.id] ?? defaultBreakdown();
    const currentGrid = gridByPlanId[selectedPlan.id] ?? [];

    let current: Breakdown = currentPlanB;
    if (target.scope === 'Раздел') {
      current = currentGrid.find((s) => s.id === target.sectionId)?.breakdown ?? currentPlanB;
    } else if (target.scope === 'Статья') {
      const sec = currentGrid.find((s) => s.id === target.sectionId);
      const ln = sec?.lines.find((l) => l.id === target.lineId);
      current = ln?.breakdown ?? sec?.breakdown ?? currentPlanB;
    }

    const selectedValuesMap: Partial<Record<AnalyticKey, Record<string, boolean>>> = {};
    for (const k of current.analytics ?? []) {
      const map: Record<string, boolean> = {};
      for (const v of ANALYTIC_VALUES[k]) {
        map[v] = current.valuesMode === 'all' ? true : !!current.selectedValues[k]?.includes(v);
      }
      selectedValuesMap[k] = map;
    }

    setBdg({
      open: true,
      target,
      applyTo: 'only',
      analytics: [...(current.analytics ?? [])],
      valuesMode: 'selected',
      selectedValues: selectedValuesMap,
    });
  };

  const setAnalyticsChecked = (k: AnalyticKey, checked: boolean) => {
    setBdg((prev) => {
      const analytics = checked
        ? prev.analytics.includes(k)
          ? prev.analytics
          : [...prev.analytics, k]
        : prev.analytics.filter((x) => x !== k);

      const selectedValues = { ...prev.selectedValues };
      if (checked && !selectedValues[k]) {
        const m: Record<string, boolean> = {};
        for (const v of ANALYTIC_VALUES[k]) m[v] = true;
        selectedValues[k] = m;
      }
      if (!checked) delete selectedValues[k];

      return { ...prev, analytics, selectedValues };
    });
  };

  const moveAnalytic = (k: AnalyticKey, dir: -1 | 1) => {
    setBdg((prev) => {
      const idx = prev.analytics.indexOf(k);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.analytics.length) return prev;
      const next = [...prev.analytics];
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...prev, analytics: next };
    });
  };

  const setValueChecked = (k: AnalyticKey, value: string, checked: boolean) => {
    setBdg((prev) => ({
      ...prev,
      selectedValues: {
        ...prev.selectedValues,
        [k]: { ...(prev.selectedValues[k] ?? {}), [value]: checked },
      },
    }));
  };

  const buildBreakdownFromDialog = (): Breakdown => {
    const analytics = [...bdg.analytics];
    if (!analytics.length) return defaultBreakdown();

    const selectedValues: Partial<Record<AnalyticKey, string[]>> = {};
    for (const k of analytics) {
      const map = bdg.selectedValues[k] ?? {};
      const picked = Object.entries(map)
        .filter(([, v]) => v)
        .map(([kk]) => kk);
      selectedValues[k] = picked.length ? picked : ANALYTIC_VALUES[k];
    }

    return { analytics, valuesMode: 'selected', selectedValues };
  };

  const generateCombos = (b: Breakdown): ComboRow[] => {
    const keys = b.analytics;
    if (!keys.length) return [];

    const pools: string[][] = keys.map((k) => {
      const list = b.selectedValues[k] ?? [];
      return list.length ? list : [ANALYTIC_VALUES[k][0]];
    });

    let acc: Partial<Record<AnalyticKey, string>>[] = [{}];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const next: Partial<Record<AnalyticKey, string>>[] = [];
      for (const base of acc) {
        for (const v of pools[i]) next.push({ ...base, [k]: v });
      }
      acc = next;
    }

    const MAX = 50;
    return acc.slice(0, MAX).map((dims) => ({ id: makeId(), dims, values: emptyValues() }));
  };

  const applyBreakdown = () => {
    if (!selectedPlan || !bdg.target) return;
    const nb = buildBreakdownFromDialog();

    const applyToLine = (ln: ArticleLine, eff: Breakdown): ArticleLine => {
      if (!eff.analytics.length) return { ...ln, breakdown: undefined, combos: [] };
      return { ...ln, breakdown: eff, combos: generateCombos(eff), isOpen: true };
    };

    if (bdg.target.scope === 'План') {
      setPlanBreakdownByPlanId((prev) => ({ ...prev, [selectedPlan.id]: nb }));

      updateGrid(selectedPlan.id, (cur) =>
        cur.map((s) => ({
          ...s,
          lines: s.lines.map((ln) => (ln.breakdown ? ln : applyToLine(ln, nb))),
        })),
      );

      closeBreakdownPanel();
      return;
    }

    if (bdg.target.scope === 'Раздел') {
      const sectionId = bdg.target.sectionId;
      updateGrid(selectedPlan.id, (cur) =>
        cur.map((s) => {
          if (s.id !== sectionId) return s;
          const nextSection: Section = { ...s, breakdown: nb.analytics.length ? nb : undefined };
          return {
            ...nextSection,
            lines: nextSection.lines.map((ln) => (ln.breakdown ? ln : applyToLine(ln, nb))),
          };
        }),
      );
      closeBreakdownPanel();
      return;
    }

    if (bdg.target.scope === 'Статья') {
      const { sectionId, lineId } = bdg.target;
      updateGrid(selectedPlan.id, (cur) =>
        cur.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            lines: s.lines.map((ln) => {
              if (bdg.applyTo === 'section') return applyToLine(ln, nb);
              if (ln.id !== lineId) return ln;
              return applyToLine(ln, nb);
            }),
          };
        }),
      );
      closeBreakdownPanel();
    }
  };

  const addCombo = (sectionId: number, lineId: number) => {
    if (!selectedPlan) return;
    updateGrid(selectedPlan.id, (cur) =>
      cur.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          lines: s.lines.map((ln) => {
            if (ln.id !== lineId) return ln;
            const eff = effLineB(s, ln);
            if (!eff.analytics.length) return ln;

            const dims: Partial<Record<AnalyticKey, string>> = {};
            for (const k of eff.analytics) dims[k] = (eff.selectedValues[k]?.[0] ?? ANALYTIC_VALUES[k][0]) as string;

            return { ...ln, combos: [...ln.combos, { id: makeId(), dims, values: emptyValues() }], isOpen: true };
          }),
        };
      }),
    );
  };

  const activeAnalyticColumns = useMemo(() => {
    if (!selectedPlanId) return [] as AnalyticKey[];

    const list: AnalyticKey[] = [];
    list.push(...getBreakdownAnalytics(planBreakdown));

    for (const s of sections) {
      list.push(...getBreakdownAnalytics(s.breakdown));
      for (const ln of s.lines) list.push(...getBreakdownAnalytics(ln.breakdown));
    }

    return uniqAnalytics(list);
  }, [planBreakdown, sections, selectedPlanId]);

  const isSectionLockedForArticles = (report: ReportType, sectionName: string) => {
    if (report === 'ПиУ' && sectionName === 'Чистая прибыль') return true;
    return false;
  };

  const startEditLineCell = (sectionId: number, lineId: number, key: PeriodKey, current: string) => {
    setEditingCell({ sectionId, lineId, key });
    setEditingValue(current ?? '');
  };

  const startEditComboCell = (sectionId: number, lineId: number, comboId: number, key: PeriodKey, current: string) => {
    setEditingCell({ sectionId, lineId, comboId, key });
    setEditingValue(current ?? '');
  };

  const commitEditingCell = () => {
    if (!editingCell) return;
    if (editingCell.comboId) {
      setComboCell(editingCell.sectionId, editingCell.lineId, editingCell.comboId, editingCell.key, editingValue);
    } else {
      setCell(editingCell.sectionId, editingCell.lineId, editingCell.key, editingValue);
    }
    setEditingCell(null);
  };

  const cancelEditingCell = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const renderSectionRow = (section: Section) => {
    const addableCount = selectedPlan
      ? getAddableArticles(selectedPlan.report, section.name, section.lines.map((l) => l.name)).length
      : 0;
    const locked = selectedPlan ? isSectionLockedForArticles(selectedPlan.report, section.name) : false;
    const canAdd = addableCount > 0 && !locked;
    const byPeriod = sumSectionByPeriod(section, periodColumns, planBreakdown);
    const showHoverActions = hoverSectionId === section.id;
    const isCalculatedSection = selectedPlan?.report === 'ПиУ' && section.name === 'Чистая прибыль';

    return (
      <tr
        className="border-b bg-gray-50"
        onMouseEnter={() => setHoverSectionId(section.id)}
        onMouseLeave={() => setHoverSectionId((p) => (p === section.id ? null : p))}
      >
        <td className="p-2 font-medium">
          <div className="flex items-center justify-between gap-2">
            <button type="button" className="flex items-center gap-2 text-left min-w-0" onClick={() => toggleSection(section.id)}>
              <span className="text-gray-500">{section.isOpen ? '▾' : '▸'}</span>
              <span className="truncate">{section.name}</span>
            </button>

            <div className="flex items-center gap-2 shrink-0 h-8">
              <Pill
                text="Аналитики"
                onClick={() => openBreakdownPanel({ scope: 'Раздел', sectionId: section.id })}
                title="Настроить аналитики (разрезы) для раздела"
                className="w-[92px]"
                hidden={!showHoverActions || !!isCalculatedSection}
              />

              <IconPlusButton
                onClick={() => openAddDialog(section.id)}
                title="Добавить статьи в раздел"
                hidden={!showHoverActions || !canAdd}
              />
            </div>
          </div>
        </td>

        {activeAnalyticColumns.map((a) => (
          <td key={a} className="p-2 text-gray-400">
            —
          </td>
        ))}

        {periodColumns.map((p) => (
          <td key={p.key} className="p-2 text-right text-gray-400">
            {byPeriod[p.key] ? byPeriod[p.key].toLocaleString('ru-RU') : '0'}
          </td>
        ))}

        <td className="p-2 text-right font-medium text-gray-600">{sumSectionTotal(section, periodColumns, planBreakdown).toLocaleString('ru-RU')}</td>
      </tr>
    );
  };

  const renderLineRow = (section: Section, ln: ArticleLine) => {
    const eff = effLineB(section, ln);
    const isSplit = eff.analytics.length > 0;
    const lineKey = `${section.id}:${ln.id}`;
    const showLineHover = hoverLineKey === lineKey;
    const totalsByPeriod = lineTotalsByPeriod(section, ln);

    return (
      <React.Fragment key={ln.id}>
        <tr
          className="border-b hover:bg-gray-50"
          onMouseEnter={() => setHoverLineKey(lineKey)}
          onMouseLeave={() => setHoverLineKey((p) => (p === lineKey ? null : p))}
        >
          <td className="p-2 pl-8">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isSplit ? (
                  <button
                    type="button"
                    className="text-gray-500"
                    onClick={() => toggleLine(section.id, ln.id)}
                    title={ln.isOpen ? 'Свернуть' : 'Развернуть'}
                  >
                    {ln.isOpen ? '▾' : '▸'}
                  </button>
                ) : (
                  <span className="w-4" />
                )}
                <span className="text-gray-800 truncate">{ln.name}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0 h-8">
                <Pill
                  text="Аналитики"
                  onClick={() => openBreakdownPanel({ scope: 'Статья', sectionId: section.id, lineId: ln.id })}
                  title="Настроить аналитики (разрезы) для статьи"
                  className="w-[92px]"
                  hidden={!showLineHover}
                />

                <IconPlusButton
                  onClick={() => addCombo(section.id, ln.id)}
                  title="Добавить комбинацию"
                  hidden={!showLineHover || !isSplit}
                />

                <button
                  type="button"
                  className={`w-8 h-8 rounded-full border border-red-200 bg-white text-red-500 hover:bg-red-50 inline-flex items-center justify-center ${
                    showLineHover ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  onClick={() => openDeleteLineDialog(section.id, ln.id, ln.name)}
                  title="Удалить статью"
                  aria-label="Удалить статью"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </td>

          {activeAnalyticColumns.map((a) => (
            <td key={a} className="p-2 text-gray-400">
              {isSplit ? '' : '—'}
            </td>
          ))}

          {periodColumns.map((p) => (
            <td key={p.key} className="p-2">
              {isSplit ? (
                <div className="text-right text-gray-400 pr-2">{totalsByPeriod[p.key] ? totalsByPeriod[p.key].toLocaleString('ru-RU') : '0'}</div>
              ) : editingCell && editingCell.sectionId === section.id && editingCell.lineId === ln.id && !editingCell.comboId && editingCell.key === p.key ? (
                <input
                  autoFocus
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={commitEditingCell}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEditingCell();
                    if (e.key === 'Escape') cancelEditingCell();
                  }}
                  className="w-full h-8 bg-transparent px-1 text-right text-sm outline-none"
                  inputMode="decimal"
                />
              ) : (
                <button
                  type="button"
                  className="w-full h-8 bg-transparent px-1 text-right text-sm hover:bg-amber-50"
                  onClick={() => startEditLineCell(section.id, ln.id, p.key, ln.values[p.key] ?? '')}
                >
                  {ln.values[p.key] || '—'}
                </button>
              )}
            </td>
          ))}

          <td className="p-2 text-right font-medium bg-gray-50">{lineTotal(section, ln).toLocaleString('ru-RU')}</td>
        </tr>

        {isSplit && ln.isOpen
          ? ln.combos.map((c) => (
              <tr key={c.id} className="border-b bg-white hover:bg-gray-50">
                <td className="p-2 pl-12 text-sm text-gray-700">Комбинация</td>

                {activeAnalyticColumns.map((a) => (
                  <td key={a} className="p-3 text-sm text-gray-700">
                    {c.dims[a] ?? '—'}
                  </td>
                ))}

                {periodColumns.map((p) => (
                  <td key={p.key} className="p-2">
                    {editingCell && editingCell.sectionId === section.id && editingCell.lineId === ln.id && editingCell.comboId === c.id && editingCell.key === p.key ? (
                      <input
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={commitEditingCell}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEditingCell();
                          if (e.key === 'Escape') cancelEditingCell();
                        }}
                        className="w-full h-8 bg-transparent px-1 text-right text-sm outline-none"
                        inputMode="decimal"
                      />
                    ) : (
                      <button
                        type="button"
                        className="w-full h-8 bg-transparent px-1 text-right text-sm hover:bg-amber-50"
                        onClick={() => startEditComboCell(section.id, ln.id, c.id, p.key, c.values[p.key] ?? '')}
                      >
                        {c.values[p.key] || '—'}
                      </button>
                    )}
                  </td>
                ))}

                <td className="p-2 text-right font-medium bg-gray-50">{sumLine(c.values, periodColumns).toLocaleString('ru-RU')}</td>
              </tr>
            ))
          : null}
      </React.Fragment>
    );
  };

  const openFromList = (id: number) => {
    setSelectedPlanId(id);
  };

  return (
    <div className={ui.page}>
      {view === 'list' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className={ui.wrap}>
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Планы</h2>
                <p className={ui.hint}>Двойной клик по строке — открыть план</p>
              </div>
              <Button className={ui.btnPrimary} onClick={addPlan}>
                + Добавить план
              </Button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="p-3">Название плана</th>
                    <th className="p-3">Автор</th>
                    <th className="p-3">Статус</th>
                    <th className="p-3">Дата создания</th>
                    <th className="p-3">Отчет</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => {
                    const isSelected = plan.id === selectedPlanId;
                    return (
                      <tr
                        key={plan.id}
                        className={`border-b hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-gray-50' : ''}`}
                        onClick={() => openFromList(plan.id)}
                        onDoubleClick={() => openCard(plan.id)}
                      >
                        <td className="p-2 font-medium">
                          <span className="truncate max-w-[360px] inline-block">{plan.name}</span>
                        </td>
                        <td className="p-3">{plan.author}</td>
                        <td className="p-3">
                          <span className={`text-xs ${plan.approved ? 'text-emerald-700' : 'text-gray-600'}`}>{statusLabel(plan.approved)}</span>
                        </td>
                        <td className="p-3">{formatDateISOToRU(plan.createdAt)}</td>
                        <td className="p-3">{plan.report}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      ) : null}

      {view === 'card' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className={ui.wrap}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[34px] leading-[40px] font-semibold">Редактирование плана 2.0</h1>
                <div className="mt-2 text-sm text-gray-500">
                  {selectedPlan ? (
                    <>
                      Автор: <span className="font-medium">{selectedPlan.author}</span> · Создан: {formatDateISOToRU(selectedPlan.createdAt)}
                    </>
                  ) : (
                    'Выберите план из списка'
                  )}
                </div>
              </div>
              <button type="button" className={ui.close} onClick={closeCard}>
                × Закрыть
              </button>
            </div>

            <div className="mt-10 space-y-10">
              {!selectedPlan ? (
                <div className="text-sm text-gray-500">Нет выбранного плана.</div>
              ) : (
                <>
                  <div className="space-y-8">
                    <div>
                      <div className={ui.label}>Название плана</div>
                      <Input
                        value={selectedPlan.name}
                        onChange={(e) => patchPlan(selectedPlan.id, { name: e.target.value })}
                        className={ui.underlineInput}
                        placeholder="Укажите название плана"
                      />
                    </div>

                    <div>
                      <div className={ui.label}>Отчет</div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          className={selectedPlan.report === 'ПиУ' ? ui.btnPrimary : ui.btnSecondary}
                          onClick={() => patchPlan(selectedPlan.id, { report: 'ПиУ' })}
                          type="button"
                        >
                          ПиУ
                        </Button>
                        <Button
                          className={selectedPlan.report === 'ДДС' ? ui.btnPrimary : ui.btnSecondary}
                          onClick={() => patchPlan(selectedPlan.id, { report: 'ДДС' })}
                          type="button"
                        >
                          ДДС
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div className={ui.label}>Статус</div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          type="button"
                          className={!selectedPlan.approved ? ui.btnPrimary : ui.btnSecondary}
                          onClick={() => setApproved(selectedPlan.id, false)}
                        >
                          Черновик
                        </Button>
                        <Button
                          type="button"
                          className={selectedPlan.approved ? ui.btnPrimary : ui.btnSecondary}
                          onClick={() => setApproved(selectedPlan.id, true)}
                        >
                          Согласован
                        </Button>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">Статус меняется здесь, на списке — только отображение.</div>
                    </div>

                    <div>
                      <div className={ui.label}>Примечание</div>
                      <textarea
                        value={selectedPlan.note}
                        onChange={(e) => patchPlan(selectedPlan.id, { note: e.target.value })}
                        className={ui.underlineTextarea}
                        placeholder="Например: предпосылки, допущения, источники"
                      />
                    </div>

                    <div>
                      <div className={ui.label}>Документы</div>
                      <div className="mt-4 flex items-center gap-4">
                        <label className="inline-flex items-center">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              patchPlan(selectedPlan.id, { attachmentName: file?.name });
                            }}
                          />
                          <Button type="button" className={ui.btnSecondary}>
                            📎 Загрузить файл
                          </Button>
                        </label>

                        <div className="text-sm text-gray-500">
                          {selectedPlan.attachmentName ? (
                            <span>
                              Использовано файлов: <span className="font-medium">1</span>
                            </span>
                          ) : (
                            <span>Использовано файлов: 0</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">Допустимые форматы: .pdf, .jpg, .jpeg, .png, .doc, .docx, .xlsx, .xls · Размером до 15Мб</div>
                    </div>

                    <div>
                      <div className="text-lg font-semibold text-gray-900">Прикрепленные файлы</div>
                      <div className="mt-4 flex items-center gap-3">
                        <Input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="Введите ссылку" className={ui.underlineInput} />
                        <button type="button" className={ui.iconBtn} aria-label="Добавить ссылку">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="h-24" />

                  <div className={ui.bottomBar}>
                    <div className={ui.bottomInner}>
                      <Button type="button" className={ui.btnSecondary} onClick={closeCard}>
                        Отменить
                      </Button>
                      <Button type="button" className={ui.btnPrimary} onClick={openValues} disabled={!selectedPlanId}>
                        Продолжить
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}

      {view === 'values' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="min-h-screen bg-white flex flex-col">
            <div className="flex-1">
              <div className="px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold">{selectedPlan?.report ?? 'ПиУ'}</div>
                    <div className="text-sm text-gray-500 mt-1">Выберите шаг и период, затем кликайте по ячейкам таблицы для ввода значений. Разрезы задаются через «Аналитики», а итоговые суммы пересчитываются автоматически.</div>
                  </div>
                  <Button type="button" className={ui.btnSecondary} onClick={() => setView('card')}>
                    ← Назад
                  </Button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <div className="text-sm text-gray-500">План:</div>
                  <Pill text={formatBreakdownLabel(planBreakdown)} onClick={() => openBreakdownPanel({ scope: 'План' })} title="Настроить аналитики (разрезы) плана" />
                </div>

                <div className="mt-3 rounded-xl border p-3 bg-gray-50">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-sm text-gray-600">Шаг таблицы:</div>
                    <div className="inline-flex rounded-lg border bg-white p-1">
                      {STEP_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            tableStep === opt.key ? 'bg-amber-400 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            setTableStep(opt.key);
                            const nextPreset = QUICK_PERIOD_OPTIONS_BY_STEP[opt.key][0].key;
                            setQuickPreset(nextPreset);
                            applyQuickPreset(opt.key, nextPreset);
                            setIsPeriodPickerOpen(false);
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="text-sm text-gray-600 ml-2">Быстрый выбор:</div>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PERIOD_OPTIONS_BY_STEP[tableStep].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            quickPreset === opt.key ? 'bg-amber-100 border-amber-300 text-gray-900' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            setQuickPreset(opt.key);
                            applyQuickPreset(tableStep, opt.key);
                            setIsPeriodPickerOpen(false);
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="text-sm text-gray-600 ml-2">Период:</div>
                    <div className="relative">
                      <button
                        type="button"
                        className="h-9 min-w-[260px] px-3 rounded-lg border bg-white text-sm text-gray-700 inline-flex items-center justify-between gap-2 hover:bg-gray-100"
                        onClick={() => setIsPeriodPickerOpen((v) => !v)}
                        aria-label="Открыть выбор периода"
                      >
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={14} />
                          {formatDateISOToRU(periodFrom)} — {formatDateISOToRU(periodTo)}
                        </span>
                        <ChevronDown size={14} />
                      </button>

                      {isPeriodPickerOpen ? (
                        <div className="absolute z-20 mt-2 right-0 w-[360px] rounded-xl border bg-white shadow-lg p-3">
                          <div className="text-xs text-gray-500 mb-2">Выберите произвольный период</div>
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            <Input
                              type="date"
                              value={periodFrom}
                              onChange={(e) => setPeriodFrom(e.target.value)}
                              className="h-9 bg-white"
                            />
                            <span className="text-gray-400">—</span>
                            <Input
                              type="date"
                              value={periodTo}
                              onChange={(e) => setPeriodTo(e.target.value)}
                              className="h-9 bg-white"
                            />
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button type="button" className={ui.btnSecondary} onClick={() => setIsPeriodPickerOpen(false)}>
                              Готово
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto border rounded-lg">
                  <table className="min-w-[1400px] w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="p-2 text-left min-w-[240px]">Статья</th>
                        {activeAnalyticColumns.map((a) => (
                          <th key={a} className="p-2 text-left min-w-[110px]">
                            {a}
                          </th>
                        ))}
                        {periodColumns.map((p) => (
                          <th key={p.key} className="p-2 text-center min-w-[72px]">
                            {p.label}
                          </th>
                        ))}
                        <th className="p-2 text-center min-w-[90px] font-semibold">Итого</th>
                      </tr>
                    </thead>

                    <tbody>
                      {sections.map((section) => (
                        <React.Fragment key={section.id}>
                          {renderSectionRow(section)}

                          {section.isOpen ? section.lines.map((ln) => renderLineRow(section, ln)) : null}

                          {section.isOpen && section.lines.length === 0 && !(selectedPlan?.report === 'ПиУ' && section.name === 'Чистая прибыль') ? (
                            <tr className="border-b">
                              <td className="p-2 pl-8 text-sm text-gray-400" colSpan={periodColumns.length + 2 + activeAnalyticColumns.length}>
                                Нет статей в разделе. Нажми “+”, чтобы добавить.
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="h-24" />
                <div className={ui.bottomBar}>
                  <div className={ui.bottomInner}>
                    <Button type="button" className={ui.btnSecondary} onClick={() => setView('card')}>
                      Отменить
                    </Button>
                    <Button type="button" className={ui.btnPrimary}>
                      Сохранить и закрыть
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {addDlg.open ? (
              <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
                <div className="absolute inset-0 bg-black/30" onClick={closeAddDialog} />
                <div className="absolute right-0 top-0 h-full w-[460px] max-w-[92vw] bg-white border-l shadow-xl">
                  <div className="p-5 border-b flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">Добавить статьи</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Раздел: <span className="font-medium">{dialogSection?.name ?? '—'}</span>
                      </div>
                    </div>
                    <button type="button" className={ui.close} onClick={closeAddDialog}>
                      × Закрыть
                    </button>
                  </div>

                  <div className="p-5 space-y-5 overflow-auto h-[calc(100%-72px)]">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-500">
                        Доступно: <span className="font-medium text-gray-700">{dialogAddableCount}</span>
                        {' · '}
                        Выбрано: <span className="font-medium text-gray-700">{dialogSelectedCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-sm text-gray-600 hover:text-gray-800"
                          onClick={() => selectAllDlg(true)}
                          disabled={dialogAddableCount === 0}
                        >
                          Выбрать все
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          className="text-sm text-gray-600 hover:text-gray-800"
                          onClick={() => selectAllDlg(false)}
                          disabled={dialogAddableCount === 0}
                        >
                          Снять
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[420px] overflow-auto border rounded-lg">
                      {dialogAddableCount === 0 ? (
                        <div className="p-4 text-sm text-gray-500">Нет доступных статей для добавления.</div>
                      ) : (
                        <ul className="divide-y">
                          {Object.keys(addDlg.selected).map((name) => (
                            <li key={name} className="flex items-center justify-between p-3 hover:bg-gray-50">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <Checkbox checked={!!addDlg.selected[name]} onCheckedChange={() => toggleDlgItem(name)} />
                                <span className="text-sm text-gray-900">{name}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <Button type="button" className={ui.btnSecondary} onClick={closeAddDialog}>
                        Отменить
                      </Button>
                      <Button type="button" className={ui.btnPrimary} onClick={applyAddDialog} disabled={dialogSelectedCount === 0}>
                        Добавить
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {deleteDlg.open ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
                <div className="absolute inset-0 bg-black/30" onClick={closeDeleteLineDialog} />
                <div className="relative w-[520px] max-w-[92vw] rounded-2xl bg-white shadow-xl border">
                  <div className="p-6">
                    <div className="text-xl font-semibold">Удалить статью?</div>
                    <div className="mt-3 text-sm text-gray-600">
                      Вы действительно хотите удалить статью <span className="font-medium text-gray-900">«{deleteDlg.lineName}»</span> из плана?
                      Все введенные по ней значения и разрезы будут очищены.
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2">
                      <Button type="button" className={ui.btnSecondary} onClick={closeDeleteLineDialog}>
                        Нет
                      </Button>
                      <Button
                        type="button"
                        className="bg-red-500 text-white hover:bg-red-600 border border-red-500"
                        onClick={confirmDeleteLine}
                      >
                        Да, удалить
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {bdg.open ? (
              <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
                <div className="absolute inset-0 bg-black/30" onClick={closeBreakdownPanel} />
                <div className="absolute right-0 top-0 h-full w-[420px] max-w-[92vw] bg-white border-l shadow-xl">
                  <div className="p-5 border-b flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">Аналитики (разрезы)</div>
                      <div className="text-sm text-gray-500 mt-1">Выбери аналитики и значения — появятся строки-комбинации.</div>
                    </div>
                    <button type="button" className={ui.close} onClick={closeBreakdownPanel}>
                      × Закрыть
                    </button>
                  </div>

                  <div className="p-5 space-y-6 overflow-auto h-[calc(100%-64px)]">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Аналитики</div>
                      <div className="mt-3 space-y-2">
                        {ANALYTICS.map((k) => {
                          const checked = bdg.analytics.includes(k);
                          return (
                            <div key={k} className="flex items-center justify-between gap-2">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <Checkbox checked={checked} onCheckedChange={(v) => setAnalyticsChecked(k, !!v)} />
                                <span className="text-sm text-gray-900">{k}</span>
                              </label>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  className={`${ui.btnSecondary} w-8 h-8 px-0`}
                                  onClick={() => moveAnalytic(k, -1)}
                                  disabled={!checked}
                                  title="Вверх"
                                >
                                  ↑
                                </Button>
                                <Button
                                  type="button"
                                  className={`${ui.btnSecondary} w-8 h-8 px-0`}
                                  onClick={() => moveAnalytic(k, +1)}
                                  disabled={!checked}
                                  title="Вниз"
                                >
                                  ↓
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-gray-900">Значения</div>
                      <div className="mt-2 text-xs text-gray-500">Для выбранных аналитик отметьте нужные значения. По умолчанию выбраны все значения.</div>
                    </div>

                    {bdg.analytics.length > 0 ? (
                      <div className="space-y-4">
                        {bdg.analytics.map((k) => (
                          <div key={k} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold text-gray-900">{k}</div>
                              <div className="flex items-center gap-2 text-xs">
                                <button
                                  type="button"
                                  className="text-gray-600 hover:text-gray-800"
                                  onClick={() => {
                                    for (const v of ANALYTIC_VALUES[k]) setValueChecked(k, v, true);
                                  }}
                                >
                                  Выбрать все
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  type="button"
                                  className="text-gray-600 hover:text-gray-800"
                                  onClick={() => {
                                    for (const v of ANALYTIC_VALUES[k]) setValueChecked(k, v, false);
                                  }}
                                >
                                  Снять
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 space-y-2">
                              {ANALYTIC_VALUES[k].map((v) => (
                                <label key={v} className="flex items-center gap-3 cursor-pointer">
                                  <Checkbox checked={!!bdg.selectedValues[k]?.[v]} onCheckedChange={(c) => setValueChecked(k, v, !!c)} />
                                  <span className="text-sm text-gray-800">{v}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {bdg.target?.scope === 'Статья' ? (
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Применить</div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            className={bdg.applyTo === 'only' ? ui.btnPrimary : ui.btnSecondary}
                            onClick={() => setBdg((p) => ({ ...p, applyTo: 'only' }))}
                          >
                            Только эта статья
                          </Button>
                          <Button
                            type="button"
                            className={bdg.applyTo === 'section' ? ui.btnPrimary : ui.btnSecondary}
                            onClick={() => setBdg((p) => ({ ...p, applyTo: 'section' }))}
                          >
                            Все статьи в разделе
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="pt-2 flex items-center justify-between">
                      <Button type="button" className={ui.btnSecondary} onClick={closeBreakdownPanel}>
                        Отменить
                      </Button>
                      <Button type="button" className={ui.btnPrimary} onClick={applyBreakdown}>
                        Применить
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
