import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  ChevronDown,
  ChevronUp,
  Code2,
  Frown,
  LayoutList,
  Pause,
  Play,
  RotateCcw,
  Send,
  Smile,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DEMO_FALLBACK_MESSAGE, SCENARIOS } from '../data/scenarios';
import {
  ClientProfile,
  ClientReplyOption,
  Scenario,
  SupportReasoning,
} from '../types/agents';
import { playSupportPing } from '../utils/sound';
import { JsonCodeBlock } from './JsonCodeBlock';
import { PipelineDiagram, ThinkingPhase } from './PipelineDiagram';

export interface ExportChatEntry {
  step: number;
  role: 'support' | 'client';
  agent?: string;
  text: string;
  is_alternative_branch?: boolean;
}

interface ScenarioViewProps {
  scenario: Scenario;
  soundEnabled: boolean;
  isGuideOpen: boolean;
  onSelectScenario: (scenarioId: string) => void;
  onGoHome: () => void;
  onOpenEvaluation: (stats: {
    altBranchesUsed: number;
    history: ExportChatEntry[];
  }) => void;
  onFirstAction: () => void;
}

type ChatMessage =
  | {
      id: string;
      role: 'support';
      step: number;
      agentLabel: string;
      text: string;
    }
  | {
      id: string;
      role: 'client';
      text: string;
      isBranch?: boolean;
    }
  | {
      id: string;
      role: 'demo_notice';
      userText: string;
      noticeText: string;
    };

const COMPACT_PROFILE_ROWS: Array<{
  key: keyof ClientProfile;
  label: string;
}> = [
  { key: 'problem_type', label: 'Тип проблемы' },
  { key: 'client_emotion', label: 'Эмоция клиента' },
  { key: 'current_hypothesis', label: 'Текущая гипотеза' },
];

const EXTRA_PROFILE_ROWS: Array<{
  key: keyof ClientProfile;
  label: string;
}> = [
  { key: 'already_tried', label: 'Что уже пробовали' },
  { key: 'next_step', label: 'Следующий шаг' },
  { key: 'resolution_status', label: 'Статус решения' },
  { key: 'negative_risk', label: 'Риск негатива' },
];

type MoodLevel = 'angry' | 'anxious' | 'calm';

function classifyEmotion(emotionText: string): {
  level: MoodLevel;
  shortLabel: string;
} {
  const lower = emotionText.toLowerCase();
  if (
    /раздраж|злост|гнев|паник|сопротивлен|негатив|нетерпен|острая/.test(lower)
  ) {
    return { level: 'angry', shortLabel: 'Раздражён' };
  }
  if (
    /тревог|беспокой|растерян|неуверен|опасени|осторож|насторож|напряж|разочарован|усталост|страх/.test(
      lower
    )
  ) {
    return { level: 'anxious', shortLabel: 'Тревожится' };
  }
  return { level: 'calm', shortLabel: 'Спокоен / доволен' };
}

export const ScenarioView: React.FC<ScenarioViewProps> = ({
  scenario,
  soundEnabled,
  isGuideOpen,
  onSelectScenario,
  onGoHome,
  onOpenEvaluation,
  onFirstAction,
}) => {
  const [mobileTab, setMobileTab] = useState<'chat' | 'agents'>('chat');
  const [panelView, setPanelView] = useState<'cards' | 'json'>('cards');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinkingPhase, setThinkingPhase] = useState<ThinkingPhase>('profiler');
  const [usedAltIds, setUsedAltIds] = useState<string[]>([]);
  const [totalAltUsedIds, setTotalAltUsedIds] = useState<Set<string>>(new Set());
  const [hasUsedBranchOnStep, setHasUsedBranchOnStep] = useState<boolean>(false);
  const [isDialogueFinished, setIsDialogueFinished] = useState<boolean>(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);
  const [isAutoDemo, setIsAutoDemo] = useState<boolean>(false);

  const [displayedReasoning, setDisplayedReasoning] = useState<SupportReasoning>(
    scenario.steps[0].support.reasoning
  );
  const [activeSupportAnswer, setActiveSupportAnswer] = useState<string>(
    scenario.steps[0].support.answer
  );
  const [highlightedFields, setHighlightedFields] = useState<Set<keyof ClientProfile>>(
    new Set()
  );

  const [customInput, setCustomInput] = useState<string>('');
  const [restartCounter, setRestartCounter] = useState<number>(0);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const timerRefs = useRef<number[]>([]);
  const prevProfileRef = useRef<ClientProfile>(scenario.steps[0].support.reasoning.profile);
  const soundEnabledRef = useRef<boolean>(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const totalSteps = scenario.steps.length;
  const currentStep = scenario.steps[stepIndex];
  const isBusy = thinkingPhase !== 'idle';

  const clearPendingTimers = useCallback(() => {
    timerRefs.current.forEach((id) => window.clearTimeout(id));
    timerRefs.current = [];
  }, []);

  const triggerFieldHighlights = useCallback((nextProfile: ClientProfile) => {
    const prev = prevProfileRef.current;
    const changed = new Set<keyof ClientProfile>();
    (Object.keys(nextProfile) as Array<keyof ClientProfile>).forEach((key) => {
      if (prev[key] !== nextProfile[key]) {
        changed.add(key);
      }
    });
    prevProfileRef.current = nextProfile;

    if (changed.size > 0) {
      setHighlightedFields(changed);
      const t = window.setTimeout(() => {
        setHighlightedFields(new Set());
      }, 1600);
      timerRefs.current.push(t);
    }
  }, []);

  const runThinkingSequence = useCallback(
    (
      fastInitial: boolean,
      onComplete: () => void
    ) => {
      clearPendingTimers();
      const d = fastInitial ? 320 : 550;
      const typingD = fastInitial ? 420 : 550;

      setThinkingPhase('profiler');

      const t1 = window.setTimeout(() => {
        setThinkingPhase('router');
      }, d);

      const t2 = window.setTimeout(() => {
        setThinkingPhase('final_agent');
      }, d * 2);

      const t3 = window.setTimeout(() => {
        setThinkingPhase('typing');
      }, d * 3);

      const t4 = window.setTimeout(() => {
        onComplete();
        setThinkingPhase('idle');
        if (soundEnabledRef.current) {
          playSupportPing();
        }
      }, d * 3 + typingD);

      timerRefs.current.push(t1, t2, t3, t4);
    },
    [clearPendingTimers]
  );

  // Initialize or restart scenario
  useEffect(() => {
    clearPendingTimers();

    const firstStep = scenario.steps[0];
    setStepIndex(0);
    setMessages([]);
    setUsedAltIds([]);
    setTotalAltUsedIds(new Set());
    setHasUsedBranchOnStep(false);
    setIsDialogueFinished(false);
    setIsDetailsExpanded(false);
    setIsAutoDemo(false);
    setMobileTab('chat');
    setCustomInput('');
    setDisplayedReasoning(firstStep.support.reasoning);
    setActiveSupportAnswer(firstStep.support.answer);
    prevProfileRef.current = firstStep.support.reasoning.profile;
    setHighlightedFields(new Set());

    runThinkingSequence(true, () => {
      setMessages([
        {
          id: `${scenario.id}-step-1-support`,
          role: 'support',
          step: 1,
          agentLabel: firstStep.support.reasoning.router.selected_agent,
          text: firstStep.support.answer,
        },
      ]);
    });

    return () => clearPendingTimers();
  }, [scenario, restartCounter, clearPendingTimers, runThinkingSequence]);

  // Smooth auto-scroll on new messages or typing state
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, thinkingPhase]);

  const handleRestart = () => {
    onFirstAction();
    setIsAutoDemo(false);
    setRestartCounter((c) => c + 1);
  };

  const executeReplyOption = useCallback(
    (option: ClientReplyOption, fromAutoDemo: boolean) => {
      if (thinkingPhase !== 'idle' || isDialogueFinished) return;
      onFirstAction();
      if (!fromAutoDemo) {
        setIsAutoDemo(false);
      }

      const displayText =
        option.is_main && hasUsedBranchOnStep && option.after_branch_text
          ? option.after_branch_text
          : option.text;

      // 1. Add client bubble immediately
      const clientMsg: ChatMessage = {
        id: `${scenario.id}-client-${Date.now()}-${option.id}`,
        role: 'client',
        text: displayText,
        isBranch: !option.is_main,
      };
      setMessages((prev) => [...prev, clientMsg]);

      // 2. Alternative branch
      if (!option.is_main && option.branch) {
        setUsedAltIds((prev) => [...prev, option.id]);
        setTotalAltUsedIds((prev) => {
          const next = new Set(prev);
          next.add(option.id);
          return next;
        });
        setHasUsedBranchOnStep(true);

        const updatedProfile: ClientProfile = {
          ...displayedReasoning.profile,
          ...option.branch.profile_patch,
        };
        const updatedReasoning: SupportReasoning = {
          profile: updatedProfile,
          router: {
            ...displayedReasoning.router,
            reason: option.branch.router_reason ?? displayedReasoning.router.reason,
          },
          final_agent: {
            ...displayedReasoning.final_agent,
            goal: option.branch.final_agent_goal ?? displayedReasoning.final_agent.goal,
          },
        };

        const replyText = option.branch.support_reply;
        setDisplayedReasoning(updatedReasoning);
        setActiveSupportAnswer(replyText);
        triggerFieldHighlights(updatedProfile);

        runThinkingSequence(false, () => {
          setMessages((prev) => [
            ...prev,
            {
              id: `${scenario.id}-branch-support-${Date.now()}`,
              role: 'support',
              step: currentStep.step,
              agentLabel: updatedReasoning.router.selected_agent,
              text: replyText,
            },
          ]);
        });
        return;
      }

      // 3. Main option -> next step or finish
      if (stepIndex < totalSteps - 1) {
        const nextIdx = stepIndex + 1;
        const nextStep = scenario.steps[nextIdx];

        setStepIndex(nextIdx);
        setUsedAltIds([]);
        setHasUsedBranchOnStep(false);
        setDisplayedReasoning(nextStep.support.reasoning);
        setActiveSupportAnswer(nextStep.support.answer);
        triggerFieldHighlights(nextStep.support.reasoning.profile);

        runThinkingSequence(false, () => {
          setMessages((prev) => [
            ...prev,
            {
              id: `${scenario.id}-step-${nextStep.step}-support-${Date.now()}`,
              role: 'support',
              step: nextStep.step,
              agentLabel: nextStep.support.reasoning.router.selected_agent,
              text: nextStep.support.answer,
            },
          ]);
        });
      } else {
        setIsAutoDemo(false);
        setIsDialogueFinished(true);
      }
    },
    [
      thinkingPhase,
      isDialogueFinished,
      onFirstAction,
      hasUsedBranchOnStep,
      scenario,
      displayedReasoning,
      triggerFieldHighlights,
      runThinkingSequence,
      currentStep.step,
      stepIndex,
      totalSteps,
    ]
  );

  // Auto-demo playback loop along the main branch (2.4s pause between steps)
  useEffect(() => {
    if (!isAutoDemo || thinkingPhase !== 'idle' || isDialogueFinished) return;

    const mainOption =
      currentStep.client_options.find(
        (opt) => opt.is_main && !usedAltIds.includes(opt.id)
      ) ?? currentStep.client_options[0];

    if (!mainOption) return;

    const t = window.setTimeout(() => {
      executeReplyOption(mainOption, true);
    }, 2400);

    return () => window.clearTimeout(t);
  }, [
    isAutoDemo,
    thinkingPhase,
    isDialogueFinished,
    currentStep,
    usedAltIds,
    executeReplyOption,
  ]);

  const buildExportHistory = useCallback((): ExportChatEntry[] => {
    const history: ExportChatEntry[] = [];
    let currentStepNum = 1;
    for (const m of messages) {
      if (m.role === 'support') {
        currentStepNum = m.step;
        history.push({
          step: m.step,
          role: 'support',
          agent: m.agentLabel,
          text: m.text,
        });
      } else if (m.role === 'client') {
        history.push({
          step: currentStepNum,
          role: 'client',
          text: m.text,
          is_alternative_branch: Boolean(m.isBranch),
        });
      }
    }
    return history;
  }, [messages]);

  const handleOpenEvaluationClick = useCallback(() => {
    onOpenEvaluation({
      altBranchesUsed: totalAltUsedIds.size,
      history: buildExportHistory(),
    });
  }, [onOpenEvaluation, totalAltUsedIds.size, buildExportHistory]);

  const availableOptions = currentStep.client_options.filter(
    (opt) => !usedAltIds.includes(opt.id)
  );

  // Keyboard shortcuts: 1/2/3 pick reply, Enter triggers primary action
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGuideOpen) return;

      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return;
      }

      if (e.key === '1' || e.key === '2' || e.key === '3') {
        if (thinkingPhase !== 'idle' || isDialogueFinished) return;
        const idx = Number(e.key) - 1;
        const chosen = availableOptions[idx];
        if (chosen) {
          e.preventDefault();
          executeReplyOption(chosen, false);
        }
        return;
      }

      if (e.key === 'Enter') {
        // Avoid double-firing if a button or link already has keyboard focus
        if (tagName === 'button' || tagName === 'a') return;

        if (isDialogueFinished) {
          e.preventDefault();
          handleOpenEvaluationClick();
          return;
        }

        if (thinkingPhase === 'idle' && availableOptions.length > 0) {
          const primaryOpt =
            availableOptions.find((o) => o.is_main) ?? availableOptions[0];
          if (primaryOpt) {
            e.preventDefault();
            executeReplyOption(primaryOpt, false);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isGuideOpen,
    thinkingPhase,
    isDialogueFinished,
    availableOptions,
    executeReplyOption,
    handleOpenEvaluationClick,
  ]);

  const handleSubmitCustomInput = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    onFirstAction();
    setIsAutoDemo(false);

    setMessages((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        role: 'demo_notice',
        userText: trimmed,
        noticeText: DEMO_FALLBACK_MESSAGE,
      },
    ]);
    setCustomInput('');
  };

  const mood = classifyEmotion(displayedReasoning.profile.client_emotion);

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      {/* Compact top progress & controls bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsAutoDemo(false);
              onGoHome();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>На главную</span>
          </button>

          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900">
              {scenario.title}
            </h1>
            <span className="text-xs font-medium text-slate-500">
              {scenario.industry} <span aria-hidden="true">·</span> {scenario.clientType}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isDialogueFinished && (
            <button
              type="button"
              onClick={() => {
                onFirstAction();
                setIsAutoDemo((prev) => !prev);
              }}
              aria-pressed={isAutoDemo}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] ${
                isAutoDemo
                  ? 'border-[#1B3A6B] bg-[#1B3A6B] text-white'
                  : 'border-[#1B3A6B]/30 bg-white text-[#1B3A6B] hover:border-[#1B3A6B] hover:bg-[#1B3A6B]/5'
              }`}
            >
              {isAutoDemo ? (
                <>
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Пауза</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span>Автодемо</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Сначала</span>
          </button>

          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
            <span className="font-mono-tabular text-xs font-bold text-[#1B3A6B]">
              Шаг {currentStep.step} из {totalSteps}
            </span>
            <div className="hidden sm:flex items-center gap-1">
              {scenario.steps.map((s, idx) => (
                <span
                  key={s.step}
                  className={`h-1.5 w-4 rounded-full transition-colors ${
                    idx < stepIndex || isDialogueFinished
                      ? 'bg-[#1B3A6B]'
                      : idx === stepIndex
                      ? 'bg-[#1B3A6B]/60'
                      : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile tabs: Чат / Агенты */}
      <div className="mb-4 flex rounded-xl bg-slate-100 p-1 lg:hidden" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'chat'}
          onClick={() => setMobileTab('chat')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors cursor-pointer ${
            mobileTab === 'chat'
              ? 'bg-white text-[#1B3A6B] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Чат
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'agents'}
          onClick={() => setMobileTab('agents')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors cursor-pointer ${
            mobileTab === 'agents'
              ? 'bg-white text-[#1B3A6B] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Агенты
        </button>
      </div>

      {/* Two-column layout: chat stretches to full column height with auto-scroll */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* LEFT COLUMN: Stretched Interactive Chat + Emotion Indicator + Client Choices */}
        <section
          aria-label="Интерактивный чат с поддержкой"
          className={`flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-6 lg:h-[calc(100vh-11.5rem)] lg:min-h-[580px] lg:max-h-[760px] ${
            mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Chat Header + Compact Emotion Indicator */}
          <div className="border-b border-slate-200 px-4 py-3 sm:px-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900">
                  Диалог с поддержкой
                </h2>
                <p className="text-xs text-slate-500">
                  {isAutoDemo
                    ? 'Идёт автодемо — реплики выбираются автоматически'
                    : 'Вы играете роль клиента · клавиши 1–3 для выбора'}
                </p>
              </div>
              <span className="text-xs font-medium text-[#1B3A6B]">
                {displayedReasoning.final_agent.agent_name}
              </span>
            </div>

            {/* Client Mood Indicator */}
            <motion.div
              key={mood.level + displayedReasoning.profile.client_emotion}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs transition-colors duration-300 ${
                mood.level === 'angry'
                  ? 'border-red-200 bg-red-50/80 text-red-800'
                  : mood.level === 'anxious'
                  ? 'border-amber-200 bg-amber-50/80 text-amber-800'
                  : 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {mood.level === 'angry' ? (
                  <Frown className="h-4 w-4 shrink-0 text-[#DC2626]" aria-hidden="true" />
                ) : mood.level === 'anxious' ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
                ) : (
                  <Smile className="h-4 w-4 shrink-0 text-[#16A34A]" aria-hidden="true" />
                )}
                <span className="font-semibold whitespace-nowrap">
                  Настроение: {mood.shortLabel}
                </span>
                <span className="hidden sm:inline truncate text-[11px] opacity-80">
                  — {displayedReasoning.profile.client_emotion}
                </span>
              </div>

              {/* 3-segment mood scale */}
              <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
                <span
                  className={`h-1.5 w-3.5 rounded-full transition-colors duration-300 ${
                    mood.level === 'angry' ? 'bg-[#DC2626]' : 'bg-slate-300/60'
                  }`}
                />
                <span
                  className={`h-1.5 w-3.5 rounded-full transition-colors duration-300 ${
                    mood.level === 'anxious' ? 'bg-[#D97706]' : 'bg-slate-300/60'
                  }`}
                />
                <span
                  className={`h-1.5 w-3.5 rounded-full transition-colors duration-300 ${
                    mood.level === 'calm' ? 'bg-[#16A34A]' : 'bg-slate-300/60'
                  }`}
                />
              </div>
            </motion.div>
          </div>

          {/* Messages Feed: flex-1 stretches cleanly to remove any void */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 sm:p-5 min-h-[260px]">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                if (msg.role === 'support') {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col items-start"
                    >
                      <span className="mb-1 px-1 text-[11px] font-medium text-slate-500">
                        Поддержка · {msg.agentLabel}
                      </span>
                      <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#1B3A6B] px-4 py-3 text-sm leading-relaxed text-white shadow-xs">
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                }

                if (msg.role === 'client') {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col items-end"
                    >
                      <span className="mb-1 px-1 text-[11px] font-medium text-slate-500">
                        Вы (клиент)
                      </span>
                      <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-slate-200 bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-900">
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3 border-t border-slate-200 pt-3"
                  >
                    <div className="flex flex-col items-end">
                      <span className="mb-1 px-1 text-[11px] font-medium text-slate-500">
                        Вы
                      </span>
                      <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900">
                        {msg.userText}
                      </div>
                    </div>

                    <div className="flex flex-col items-start">
                      <span className="mb-1 px-1 text-[11px] font-medium text-[#1B3A6B]">
                        Демо-стенд STIMIT
                      </span>
                      <div className="max-w-[95%] rounded-2xl rounded-tl-sm border border-[#1B3A6B]/20 bg-[#1B3A6B]/5 px-4 py-3 text-sm leading-relaxed text-slate-800">
                        <p>{msg.noticeText}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {SCENARIOS.map((sc) => (
                            <button
                              key={sc.id}
                              type="button"
                              onClick={() => onSelectScenario(sc.id)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] ${
                                sc.id === scenario.id
                                  ? 'bg-[#1B3A6B] text-white'
                                  : 'border border-slate-300 bg-white text-[#1B3A6B] hover:border-[#1B3A6B]'
                              }`}
                            >
                              {sc.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Pipeline thinking status OR typing indicator */}
              {thinkingPhase === 'typing' && (
                <motion.div
                  key="typing-indicator"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-start"
                >
                  <span className="mb-1 px-1 text-[11px] font-medium text-slate-500">
                    Поддержка печатает…
                  </span>
                  <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-[#1B3A6B]/10 px-4 py-3">
                    <motion.span
                      className="h-2 w-2 rounded-full bg-[#1B3A6B]"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: 0 }}
                    />
                    <motion.span
                      className="h-2 w-2 rounded-full bg-[#1B3A6B]"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: 0.15 }}
                    />
                    <motion.span
                      className="h-2 w-2 rounded-full bg-[#1B3A6B]"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}

              {(thinkingPhase === 'profiler' ||
                thinkingPhase === 'router' ||
                thinkingPhase === 'final_agent') && (
                <motion.div
                  key="thinking-status"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2 px-1 py-1 text-xs font-medium text-[#1B3A6B]/80"
                >
                  <span className="h-2 w-2 rounded-full bg-[#1B3A6B] animate-pulse" />
                  <span>
                    {thinkingPhase === 'profiler' && 'Профайлер: обновляю профиль клиента…'}
                    {thinkingPhase === 'router' && 'Маршрутизатор: выбираю агента…'}
                    {thinkingPhase === 'final_agent' &&
                      `${displayedReasoning.router.selected_agent}: формирую ответ…`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>

          {/* Interactive Client Reply Picker OR Final CTA */}
          <div className="border-t border-slate-200 bg-slate-50/80 p-4 sm:p-5 rounded-b-2xl">
            {isDialogueFinished ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-3 text-center py-1"
              >
                <p className="text-sm font-medium text-slate-700">
                  Диалог успешно завершён! Нажмите Enter или кнопку ниже, чтобы увидеть итог.
                </p>
                <button
                  type="button"
                  onClick={handleOpenEvaluationClick}
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#1B3A6B] px-7 text-base font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#142C52] hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] focus-visible:ring-offset-2"
                >
                  <Award className="h-5 w-5" aria-hidden="true" />
                  <span>Оценка качества диалога</span>
                </button>
              </motion.div>
            ) : (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    {isBusy
                      ? 'Агенты обрабатывают обращение…'
                      : 'Выберите ваш ответ за клиента:'}
                  </span>
                </div>

                <div className="space-y-2">
                  {availableOptions.map((opt, idx) => {
                    const label =
                      opt.is_main && hasUsedBranchOnStep && opt.after_branch_text
                        ? opt.after_branch_text
                        : opt.text;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isBusy}
                        onClick={() => executeReplyOption(opt, false)}
                        className={`flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] ${
                          opt.is_main
                            ? 'border-[#1B3A6B]/30 bg-white text-slate-900 shadow-xs hover:border-[#1B3A6B] hover:bg-[#1B3A6B]/[0.03]'
                            : 'border-slate-200 bg-white/80 text-slate-700 hover:border-slate-400 hover:bg-white'
                        }`}
                      >
                        <span className="font-mono-tabular mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Secondary arbitrary input */}
                <form
                  onSubmit={handleSubmitCustomInput}
                  className="mt-3 flex items-center gap-2 border-t border-slate-200/80 pt-2.5"
                >
                  <label htmlFor="demo-chat-input" className="sr-only">
                    Произвольный текст (проверка демо-стенда)
                  </label>
                  <input
                    id="demo-chat-input"
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Или напишите свой текст (демо-проверка)…"
                    className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/15"
                  />
                  <button
                    type="submit"
                    aria-label="Отправить произвольное сообщение"
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-[#1B3A6B] hover:text-[#1B3A6B] cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Sequential Pipeline + Cards/JSON Switcher */}
        <section
          aria-label="Работа агентов"
          className={`space-y-4 lg:col-span-6 ${
            mobileTab === 'agents' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Pipeline diagram with sequential thinking phases */}
          <PipelineDiagram
            selectedAgent={displayedReasoning.router.selected_agent}
            thinkingPhase={thinkingPhase}
            isLastStep={stepIndex === totalSteps - 1}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {/* Header with Cards | JSON-вид toggle */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Внутренняя работа агентов
                </div>
                <div className="font-display text-base font-bold text-[#1B3A6B]">
                  {displayedReasoning.final_agent.agent_name}
                </div>
              </div>

              <div
                className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
                role="tablist"
                aria-label="Режим просмотра данных агента"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={panelView === 'cards'}
                  onClick={() => setPanelView('cards')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    panelView === 'cards'
                      ? 'bg-white text-[#1B3A6B] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutList className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Карточки</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={panelView === 'json'}
                  onClick={() => setPanelView('json')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    panelView === 'json'
                      ? 'bg-white text-[#1B3A6B] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>JSON-вид</span>
                </button>
              </div>
            </div>

            {panelView === 'json' ? (
              <motion.div
                key="json-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.16 }}
                className="space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Сырой JSON текущего шага (reasoning + answer)</span>
                  <span className="font-mono-tabular">Шаг {currentStep.step}</span>
                </div>
                <JsonCodeBlock
                  data={{
                    step: currentStep.step,
                    reasoning: displayedReasoning,
                    answer: activeSupportAnswer,
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key={`${scenario.id}-cards-${stepIndex}`}
                initial={{ opacity: 0.75, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
              >
                {/* Router reason */}
                <p className="mb-4 text-sm leading-relaxed text-slate-600">
                  {displayedReasoning.router.reason}
                </p>

                {/* 3 Key Profiler Fields (default compact view) with 1.6s change highlight */}
                <div className="border-t border-slate-100 pt-4">
                  <h2 className="mb-2.5 text-xs font-semibold text-slate-500">
                    Ключевые данные профиля (Профайлер)
                  </h2>

                  <dl className="space-y-2.5">
                    {COMPACT_PROFILE_ROWS.map((row) => {
                      const isHighlighted = highlightedFields.has(row.key);
                      return (
                        <div
                          key={row.key}
                          className={`rounded-xl px-3 py-2 transition-colors duration-300 ${
                            isHighlighted
                              ? 'bg-[#EEF3FA] ring-1 ring-[#1B3A6B]/30'
                              : 'bg-slate-50/80'
                          }`}
                        >
                          <dt className="text-[11px] font-semibold text-slate-500">
                            {row.label}
                          </dt>
                          <dd className="mt-0.5 text-sm font-medium text-slate-900 leading-snug">
                            {displayedReasoning.profile[row.key]}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>

                {/* Expandable details */}
                <div className="mt-4 border-t border-slate-100 pt-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      onFirstAction();
                      setIsDetailsExpanded((v) => !v);
                    }}
                    aria-expanded={isDetailsExpanded}
                    className="inline-flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-[#1B3A6B] transition-colors hover:border-[#1B3A6B]/40 hover:bg-[#1B3A6B]/5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B]"
                  >
                    <span>Подробнее: как думали агенты (все 7 полей и логика)</span>
                    {isDetailsExpanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isDetailsExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="mt-4 space-y-4 border-t border-slate-100 pt-4"
                      >
                        <div>
                          <h3 className="mb-2 text-xs font-semibold text-slate-500">
                            Остальные поля профиля клиента (4 из 7)
                          </h3>
                          <dl className="space-y-2">
                            {EXTRA_PROFILE_ROWS.map((row) => {
                              const isHighlighted = highlightedFields.has(row.key);
                              return (
                                <div
                                  key={row.key}
                                  className={`rounded-xl px-3 py-2 transition-colors duration-300 ${
                                    isHighlighted
                                      ? 'bg-[#EEF3FA] ring-1 ring-[#1B3A6B]/30'
                                      : 'bg-slate-50/70'
                                  }`}
                                >
                                  <dt className="text-[11px] font-semibold text-slate-500">
                                    {row.label}
                                  </dt>
                                  <dd className="mt-0.5 text-sm text-slate-800 leading-snug">
                                    {displayedReasoning.profile[row.key]}
                                  </dd>
                                </div>
                              );
                            })}
                          </dl>
                        </div>

                        <div className="space-y-3 border-t border-slate-100 pt-3">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-500">
                              Цель ответа ({displayedReasoning.final_agent.agent_name})
                            </div>
                            <p className="mt-0.5 text-sm leading-relaxed text-slate-800">
                              {displayedReasoning.final_agent.goal}
                            </p>
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-slate-500">
                              Логика построения ответа
                            </div>
                            <p className="mt-0.5 text-sm leading-relaxed text-slate-700">
                              {displayedReasoning.final_agent.response_logic}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
