import type React from 'react';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

type ReportType = 'ПиУ' | 'ДДС';
type View = 'list' | 'card' | 'values';

type Plan = {
  id: number;
  name: string;
  author: string;
  approved: boolean;
  createdAt: string;
  report: ReportType;
  note: string;
};

const CURRENT_USER = 'Сухачев Никита';
const TODAY_ISO = '2026-02-12';

function formatDateISOToRU(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

function statusLabel(approved: boolean): 'Согласован' | 'Черновик' {
  return approved ? 'Согласован' : 'Черновик';
}

function makeId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        border: '1px solid #d1d5db',
        background: props.disabled ? '#f3f4f6' : '#fff',
        borderRadius: 8,
        padding: '8px 12px',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        ...((props.style ?? {}) as object),
      }}
    >
      {props.children}
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        border: '1px solid #d1d5db',
        borderRadius: 8,
        padding: '8px 10px',
        ...((props.style ?? {}) as object),
      }}
    />
  );
}

export default function App() {
  const [view, setView] = useState<View>('list');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: 1,
      name: 'План продаж',
      author: CURRENT_USER,
      approved: false,
      createdAt: TODAY_ISO,
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
    },
  ]);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);

  const patchPlan = (id: number, patch: Partial<Plan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
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

  return (
    <div style={{ minHeight: '100vh', background: 'white', color: '#111827', fontFamily: 'Inter, Arial, sans-serif' }}>
      {view === 'list' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0 }}>Планы</h1>
              <div style={{ color: '#6b7280', marginTop: 8 }}>Двойной клик по строке — открыть план</div>
            </div>
            <Button onClick={addPlan} style={{ background: '#fcd34d' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> Добавить план
              </span>
            </Button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Название</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Автор</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Статус</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Дата</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>Отчет</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  onDoubleClick={() => {
                    setSelectedPlanId(plan.id);
                    setView('card');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>{plan.name}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>{plan.author}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>{statusLabel(plan.approved)}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>{formatDateISOToRU(plan.createdAt)}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>{plan.report}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {view === 'card' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <h1 style={{ margin: 0 }}>Редактирование плана 2.0</h1>
            <Button onClick={() => setView('list')}>× Закрыть</Button>
          </div>

          {!selectedPlan ? (
            <p>Выберите план из списка</p>
          ) : (
            <div style={{ marginTop: 20, display: 'grid', gap: 14 }}>
              <div>
                <div style={{ marginBottom: 8 }}>Название плана</div>
                <Input value={selectedPlan.name} onChange={(e) => patchPlan(selectedPlan.id, { name: e.target.value })} />
              </div>

              <div>
                <div style={{ marginBottom: 8 }}>Отчет</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    style={{ background: selectedPlan.report === 'ПиУ' ? '#fcd34d' : '#fff' }}
                    onClick={() => patchPlan(selectedPlan.id, { report: 'ПиУ' })}
                  >
                    ПиУ
                  </Button>
                  <Button
                    style={{ background: selectedPlan.report === 'ДДС' ? '#fcd34d' : '#fff' }}
                    onClick={() => patchPlan(selectedPlan.id, { report: 'ДДС' })}
                  >
                    ДДС
                  </Button>
                </div>
              </div>

              <div>
                <div style={{ marginBottom: 8 }}>Статус</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    style={{ background: !selectedPlan.approved ? '#fcd34d' : '#fff' }}
                    onClick={() => patchPlan(selectedPlan.id, { approved: false })}
                  >
                    Черновик
                  </Button>
                  <Button
                    style={{ background: selectedPlan.approved ? '#fcd34d' : '#fff' }}
                    onClick={() => patchPlan(selectedPlan.id, { approved: true })}
                  >
                    Согласован
                  </Button>
                </div>
              </div>

              <div>
                <div style={{ marginBottom: 8 }}>Примечание</div>
                <textarea
                  value={selectedPlan.note}
                  onChange={(e) => patchPlan(selectedPlan.id, { note: e.target.value })}
                  style={{ width: '100%', minHeight: 120, border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <Button onClick={() => setView('list')}>Отменить</Button>
                <Button onClick={() => setView('values')} style={{ background: '#fcd34d' }}>
                  Продолжить
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {view === 'values' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
          <h1 style={{ marginTop: 0 }}>Значения ({selectedPlan?.report ?? 'ПиУ'})</h1>
          <p style={{ color: '#6b7280' }}>Экран-заглушка. Базовая логика работает; экран больше не пустой.</p>
          <Button onClick={() => setView('card')}>← Назад</Button>
        </motion.div>
      )}
    </div>
  );
}
