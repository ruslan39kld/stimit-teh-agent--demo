import React from 'react';
import { BookOpen, Volume2, VolumeX } from 'lucide-react';

interface TopBarProps {
  activeScreen: 'home' | 'scenario' | 'evaluation';
  onGoHome: () => void;
  onSelectScenario: (scenarioId: string) => void;
  activeScenarioId?: string;
  onOpenGuide: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeScreen,
  onGoHome,
  onSelectScenario,
  activeScenarioId,
  onOpenGuide,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3.5 sm:gap-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onGoHome}
          className="font-display text-xl font-extrabold tracking-tight text-[#1B3A6B] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] rounded-md px-1 -ml-1"
        >
          STIMIT
        </button>

        <nav
          aria-label="Основная навигация"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={onGoHome}
            className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#1B3A6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] rounded px-1 py-0.5 ${
              activeScreen === 'home' ? 'text-[#1B3A6B] font-semibold underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Все сценарии
          </button>
          <button
            type="button"
            onClick={() => onSelectScenario('transfer-pending')}
            className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#1B3A6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] rounded px-1 py-0.5 ${
              activeScreen !== 'home' && activeScenarioId === 'transfer-pending'
                ? 'text-[#1B3A6B] font-semibold underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Перевод
          </button>
          <button
            type="button"
            onClick={() => onSelectScenario('missing-sms-code')}
            className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#1B3A6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] rounded px-1 py-0.5 ${
              activeScreen !== 'home' && activeScenarioId === 'missing-sms-code'
                ? 'text-[#1B3A6B] font-semibold underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            SMS с кодом
          </button>
          <button
            type="button"
            onClick={() => onSelectScenario('wrong-order-delivered')}
            className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#1B3A6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] rounded px-1 py-0.5 ${
              activeScreen !== 'home' && activeScenarioId === 'wrong-order-delivered'
                ? 'text-[#1B3A6B] font-semibold underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Не тот заказ
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Выключить звук сообщений' : 'Включить звук сообщений'}
            title={soundEnabled ? 'Звук включён' : 'Звук выключен'}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] ${
              soundEnabled
                ? 'border-[#1B3A6B]/40 bg-[#1B3A6B]/8 text-[#1B3A6B]'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#1B3A6B] transition-colors hover:border-[#1B3A6B] hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B]"
          >
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Как устроена система</span>
          </button>
        </div>
      </div>
    </header>
  );
};
