import React from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  MessageSquareLock,
  PackageX,
  Play,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SCENARIOS } from '../data/scenarios';

interface HomeViewProps {
  onSelectScenario: (scenarioId: string) => void;
  onStartFirstExample: () => void;
  onOpenGuide: () => void;
}

const SCENARIO_ICONS: Record<string, React.ReactNode> = {
  'transfer-pending': <ArrowLeftRight className="h-5 w-5 text-[#1B3A6B]" aria-hidden="true" />,
  'missing-sms-code': <MessageSquareLock className="h-5 w-5 text-[#1B3A6B]" aria-hidden="true" />,
  'wrong-order-delivered': <PackageX className="h-5 w-5 text-[#1B3A6B]" aria-hidden="true" />,
};

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectScenario,
  onStartFirstExample,
  onOpenGuide,
}) => {
  return (
    <main>
      {/* Dark-blue gradient Hero block */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B3A6B] via-[#152E56] to-[#0D1E3A] text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left: Question headline, 1-line subtitle, single primary CTA */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/95">
                STIMIT · Демо-стенд
              </div>

              <h1 className="font-display mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15] text-balance">
                Как AI из 6 агентов решает проблему клиента за 5 шагов?
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
                Вы отвечаете за клиента, выбираете реплики — и сразу видите, как система анализирует ситуацию и ведёт к решению.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onStartFirstExample}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-[#1B3A6B] shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B3A6B]"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span>Смотреть пример</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/15 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Как устроена система</span>
                </button>
              </div>
            </div>

            {/* Right: Animated agent pipeline schematic with traveling signal dot */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-6 backdrop-blur-xs">
                <div className="mb-4 flex items-center justify-between text-xs font-medium text-slate-200">
                  <span>Конвейер каждого ответа</span>
                  <span className="font-mono-tabular text-white/75">6 агентов</span>
                </div>

                {/* Animated horizontal track on sm+ */}
                <div className="relative space-y-4">
                  {/* Track line with traveling signal dot */}
                  <div className="relative flex items-center justify-between gap-2">
                    <div
                      aria-hidden="true"
                      className="absolute left-6 right-6 top-1/2 h-0.5 -translate-y-1/2 bg-white/20"
                    />
                    <motion.div
                      aria-hidden="true"
                      className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
                      animate={{ left: ['8%', '48%', '88%'] }}
                      transition={{
                        duration: 2.6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />

                    {/* Node 1 */}
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 2.6, repeat: Infinity, delay: 0 }}
                      className="relative z-10 flex flex-col items-center rounded-xl border border-white/25 bg-[#152E56] px-3 py-2.5 text-center shadow-sm"
                    >
                      <span className="font-mono-tabular text-[10px] text-slate-300">01</span>
                      <span className="text-xs font-bold text-white">Профайлер</span>
                    </motion.div>

                    {/* Node 2 */}
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 2.6, repeat: Infinity, delay: 0.85 }}
                      className="relative z-10 flex flex-col items-center rounded-xl border border-white/25 bg-[#152E56] px-3 py-2.5 text-center shadow-sm"
                    >
                      <span className="font-mono-tabular text-[10px] text-slate-300">02</span>
                      <span className="text-xs font-bold text-white">Маршрутизатор</span>
                    </motion.div>

                    {/* Node 3 */}
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 2.6, repeat: Infinity, delay: 1.7 }}
                      className="relative z-10 flex flex-col items-center rounded-xl border border-white/40 bg-white px-3 py-2.5 text-center shadow-sm"
                    >
                      <span className="font-mono-tabular text-[10px] text-[#1B3A6B]/70">03</span>
                      <span className="text-xs font-bold text-[#1B3A6B]">Финальный агент</span>
                    </motion.div>
                  </div>

                  {/* 4 specialized final agents */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15 sm:grid-cols-4">
                    {['Диагност', 'Навигатор', 'Консультант', 'Финализатор'].map((name) => (
                      <div
                        key={name}
                        className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-center text-[11px] font-medium text-slate-100"
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary row: Choose from 3 scenarios */}
      <section
        aria-label="Выбор сценария"
        className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
      >
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Или выберите любой из 3 сценариев
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              В каждом сценарии вы играете за клиента: можно идти по основному пути или проверять нестандартные ответы.
            </p>
          </div>
          <span className="font-mono-tabular text-xs font-medium text-slate-400">
            5 шагов · оценка в конце
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onSelectScenario(scenario.id)}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#1B3A6B]/60 hover:shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B]"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B3A6B]/8 transition-colors group-hover:bg-[#1B3A6B]/14">
                    {SCENARIO_ICONS[scenario.id] ?? (
                      <ArrowLeftRight className="h-5 w-5 text-[#1B3A6B]" aria-hidden="true" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {scenario.industry} <span aria-hidden="true">·</span> {scenario.clientType}
                  </span>
                </div>

                <h3 className="font-display mt-4 text-lg font-bold text-slate-900 group-hover:text-[#1B3A6B]">
                  {scenario.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {scenario.shortContext}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-sm font-semibold text-[#1B3A6B]">
                <span>Запустить сценарий</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </div>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Демо-стенд STIMIT работает полностью автономно на заранее прописанных сценариях и ветках диалога, без обращения к внешним API.
        </p>
      </section>
    </main>
  );
};
