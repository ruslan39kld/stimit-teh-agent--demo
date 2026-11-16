import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FinalAgentType } from '../types/agents';

export type ThinkingPhase = 'idle' | 'profiler' | 'router' | 'final_agent' | 'typing';

interface PipelineDiagramProps {
  selectedAgent: FinalAgentType;
  thinkingPhase: ThinkingPhase;
  isLastStep?: boolean;
}

const FINAL_AGENTS: FinalAgentType[] = ['Диагност', 'Навигатор', 'Консультант', 'Финализатор'];

function getPhaseLabel(phase: ThinkingPhase, isLastStep: boolean): string {
  switch (phase) {
    case 'profiler':
      return 'обновляю профиль клиента…';
    case 'router':
      return 'выбираю агента…';
    case 'final_agent':
      return 'формирую ответ…';
    case 'typing':
      return 'печатаю ответ клиенту…';
    default:
      return isLastStep ? 'конвейер завершён' : 'конвейер в работе';
  }
}

export const PipelineDiagram: React.FC<PipelineDiagramProps> = ({
  selectedAgent,
  thinkingPhase,
  isLastStep = false,
}) => {
  const isProfilerActive = thinkingPhase === 'profiler';
  const isProfilerDone =
    thinkingPhase === 'router' ||
    thinkingPhase === 'final_agent' ||
    thinkingPhase === 'typing' ||
    thinkingPhase === 'idle';

  const isRouterActive = thinkingPhase === 'router';
  const isRouterDone =
    thinkingPhase === 'final_agent' ||
    thinkingPhase === 'typing' ||
    thinkingPhase === 'idle';

  const isFinalActive =
    thinkingPhase === 'final_agent' || thinkingPhase === 'typing';
  const isFinalDone = thinkingPhase === 'idle';

  const statusText = getPhaseLabel(thinkingPhase, isLastStep);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 sm:p-4">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700">Конвейер принятия решения</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={thinkingPhase}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.15 }}
            className={`font-medium ${
              thinkingPhase === 'idle' ? 'text-slate-500' : 'text-[#1B3A6B]'
            }`}
          >
            {statusText}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Stage 1: Profiler */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
            isProfilerActive
              ? 'bg-[#1B3A6B] text-white ring-2 ring-[#1B3A6B]/40 shadow-sm'
              : isProfilerDone
              ? 'bg-[#1B3A6B] text-white'
              : 'border border-slate-200 bg-white text-slate-400'
          }`}
        >
          {isProfilerActive && (
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
          )}
          {!isProfilerActive && isProfilerDone && (
            <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
          )}
          <span>Профайлер</span>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />

        {/* Stage 2: Router */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
            isRouterActive
              ? 'bg-[#1B3A6B] text-white ring-2 ring-[#1B3A6B]/40 shadow-sm'
              : isRouterDone
              ? 'bg-[#1B3A6B] text-white'
              : 'border border-slate-200 bg-white text-slate-400'
          }`}
        >
          {isRouterActive && (
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
          )}
          {!isRouterActive && isRouterDone && (
            <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
          )}
          <span>Маршрутизатор</span>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />

        {/* Stage 3: Final Agents */}
        <div className="flex flex-wrap items-center gap-1.5">
          {FINAL_AGENTS.map((agent) => {
            const isSelected = agent === selectedAgent;
            const isLit = isSelected && (isFinalActive || isFinalDone);
            return (
              <div
                key={agent}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  isSelected && isFinalActive
                    ? 'bg-[#1B3A6B] text-white shadow-sm ring-2 ring-[#1B3A6B]/40'
                    : isLit
                    ? 'bg-[#1B3A6B] text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-400'
                }`}
              >
                {isSelected && isFinalActive && (
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
                )}
                {isSelected && isFinalDone && (
                  <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                )}
                <span>{agent}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
