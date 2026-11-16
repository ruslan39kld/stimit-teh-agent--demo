import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  GitBranch,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CRITERION_LABELS } from '../data/systemArchitecture';
import { Scenario } from '../types/agents';
import { ExportChatEntry } from './ScenarioView';

interface EvaluationViewProps {
  scenario: Scenario;
  altBranchesUsed: number;
  playedHistory: ExportChatEntry[];
  isGuideOpen: boolean;
  onGoHome: () => void;
  onRestartScenario: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  scenario,
  altBranchesUsed,
  playedHistory,
  isGuideOpen,
  onGoHome,
  onRestartScenario,
}) => {
  const { criteria, final_result } = scenario.evaluation;
  const [animatedScore, setAnimatedScore] = useState<number>(0);

  const altBranchesTotal = scenario.steps.reduce(
    (sum, s) => sum + s.client_options.filter((o) => !o.is_main).length,
    0
  );

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAnimatedScore(final_result.overall_score);
      return;
    }

    const target = final_result.overall_score;
    const duration = 900;
    const startTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(target * eased);
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      } else {
        setAnimatedScore(target);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [final_result.overall_score, scenario.id]);

  // Enter shortcut triggers primary CTA "К другим примерам"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGuideOpen) return;
      const tagName = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tagName === 'button' || tagName === 'a' || tagName === 'input') return;
      if (e.key === 'Enter') {
        e.preventDefault();
        onGoHome();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGuideOpen, onGoHome]);

  const handleDownloadJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      stand: 'STIMIT Multi-Agent Support Demo',
      scenario: {
        id: scenario.id,
        title: scenario.title,
        industry: scenario.industry,
        client_type: scenario.clientType,
        context: scenario.shortContext,
      },
      session_stats: {
        alternative_replies_used: altBranchesUsed,
        alternative_replies_total: altBranchesTotal,
      },
      played_dialogue_history: playedHistory,
      scenario_steps_reasoning: scenario.steps.map((s) => ({
        step: s.step,
        support: s.support,
        client_response: s.client_response,
      })),
      evaluation: scenario.evaluation,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stimit-dialogue-${scenario.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Результат миссии <span aria-hidden="true">·</span> {scenario.industry}{' '}
            <span aria-hidden="true">·</span> {scenario.clientType}
          </p>
          <h1 className="font-display mt-1 text-2xl sm:text-3xl font-extrabold text-[#1B3A6B]">
            Оценка диалога: «{scenario.title}»
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1B3A6B]/30 bg-white px-4 py-2 text-sm font-semibold text-[#1B3A6B] transition-colors hover:border-[#1B3A6B] hover:bg-[#1B3A6B]/5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Скачать диалог (JSON)</span>
          </button>

          <button
            type="button"
            onClick={onRestartScenario}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Пройти заново</span>
          </button>
        </div>
      </div>

      {/* Mission Result Summary Block */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Итоговая оценка"
        className="rounded-2xl border border-[#1B3A6B]/20 bg-gradient-to-br from-[#1B3A6B]/[0.04] to-slate-50 p-6 sm:p-8 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4 lg:border-r lg:border-slate-200 lg:pr-6">
            <div className="text-xs font-semibold text-slate-500">Итоговый балл системы</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-mono-tabular text-5xl sm:text-6xl font-extrabold tracking-tight text-[#1B3A6B]">
                {animatedScore.toFixed(1)}
              </span>
              <span className="font-mono-tabular text-xl font-semibold text-slate-400">
                / 10
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900 leading-snug">
              Вердикт: {final_result.final_verdict}
            </p>

            {/* Alternative branches stats line */}
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700">
              <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-[#1B3A6B]" aria-hidden="true" />
              <span>
                Вы проверили систему{' '}
                <strong className="font-mono-tabular text-[#1B3A6B]">
                  {altBranchesUsed}
                </strong>{' '}
                раз нестандартными репликами из{' '}
                <strong className="font-mono-tabular text-slate-900">
                  {altBranchesTotal}
                </strong>{' '}
                возможных
              </span>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="text-xs font-semibold text-slate-500">Резюме агента-оценщика</div>
            <p className="mt-1.5 text-base leading-relaxed text-slate-700">
              {final_result.overall_comment}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900">
                  Сильные стороны
                </h2>
                <ul className="mt-2.5 space-y-2">
                  {final_result.main_strengths.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="font-display text-sm font-bold text-slate-900">
                  Что улучшить
                </h2>
                <ul className="mt-2.5 space-y-2">
                  {final_result.main_weaknesses.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <AlertCircle
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 7 Criteria Cards revealing sequentially */}
      <section aria-label="Детальные критерии оценки" className="mt-8">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Разбор по 7 критериям
          </h2>
          <span className="font-mono-tabular text-xs font-medium text-slate-500">
            Шкала 1–10
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {CRITERION_LABELS.map((item, idx) => {
            const data = criteria[item.key];
            const percentage = Math.min(100, Math.max(0, (data.score / 10) * 100));
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: 0.1 + idx * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-base font-bold text-slate-900">
                      <span className="font-mono-tabular mr-2 text-xs font-medium text-slate-400">
                        0{idx + 1}
                      </span>
                      {item.title}
                    </h3>
                    <span className="font-mono-tabular text-base font-bold text-[#1B3A6B] whitespace-nowrap">
                      {data.score} / 10
                    </span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div
                    className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={data.score}
                    aria-valuemin={0}
                    aria-valuemax={10}
                    aria-label={`${item.title}: ${data.score} из 10`}
                  >
                    <motion.div
                      className="h-full rounded-full bg-[#1B3A6B]"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{
                        duration: 0.55,
                        delay: 0.15 + idx * 0.08,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  </div>
                </div>

                <p className="mt-3.5 text-sm leading-relaxed text-slate-600">
                  {data.comment}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={onRestartScenario}
          className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Пройти сценарий заново</span>
        </button>

        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#1B3A6B] px-7 text-sm sm:text-base font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#142C52] hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>К другим примерам</span>
        </button>
      </div>
    </main>
  );
};
