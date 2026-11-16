import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { EvaluationView } from './components/EvaluationView';
import { HomeView } from './components/HomeView';
import { ExportChatEntry, ScenarioView } from './components/ScenarioView';
import { SystemGuideModal } from './components/SystemGuideModal';
import { TopBar } from './components/TopBar';
import { SCENARIOS } from './data/scenarios';

type ActiveScreen = 'home' | 'scenario' | 'evaluation';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [activeScenarioId, setActiveScenarioId] = useState<string>(SCENARIOS[0].id);
  const [sessionCounter, setSessionCounter] = useState<number>(0);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [showCoachmark, setShowCoachmark] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  const [lastAltBranchesUsed, setLastAltBranchesUsed] = useState<number>(0);
  const [lastPlayedHistory, setLastPlayedHistory] = useState<ExportChatEntry[]>([]);

  const activeScenario =
    SCENARIOS.find((item) => item.id === activeScenarioId) ?? SCENARIOS[0];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dismissCoachmark = () => {
    if (showCoachmark) {
      setShowCoachmark(false);
    }
  };

  const handleGoHome = () => {
    dismissCoachmark();
    setActiveScreen('home');
    scrollToTop();
  };

  const handleSelectScenario = (scenarioId: string) => {
    dismissCoachmark();
    setActiveScenarioId(scenarioId);
    setSessionCounter((c) => c + 1);
    setLastAltBranchesUsed(0);
    setLastPlayedHistory([]);
    setActiveScreen('scenario');
    scrollToTop();
  };

  const handleStartFirstExample = () => {
    handleSelectScenario(SCENARIOS[0].id);
  };

  const handleOpenEvaluation = (stats: {
    altBranchesUsed: number;
    history: ExportChatEntry[];
  }) => {
    dismissCoachmark();
    setLastAltBranchesUsed(stats.altBranchesUsed);
    setLastPlayedHistory(stats.history);
    setActiveScreen('evaluation');
    scrollToTop();
  };

  const handleRestartScenario = () => {
    dismissCoachmark();
    setSessionCounter((c) => c + 1);
    setLastAltBranchesUsed(0);
    setLastPlayedHistory([]);
    setActiveScreen('scenario');
    scrollToTop();
  };

  const handleOpenGuide = () => {
    dismissCoachmark();
    setIsGuideOpen(true);
  };

  // Enter shortcut on Home screen triggers "Смотреть пример"
  useEffect(() => {
    if (activeScreen !== 'home' || isGuideOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tagName = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tagName === 'button' || tagName === 'a' || tagName === 'input') return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleStartFirstExample();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <TopBar
        activeScreen={activeScreen}
        activeScenarioId={activeScenarioId}
        onGoHome={handleGoHome}
        onSelectScenario={handleSelectScenario}
        onOpenGuide={handleOpenGuide}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      <div className="flex-1">
        {activeScreen === 'home' && (
          <HomeView
            onSelectScenario={handleSelectScenario}
            onStartFirstExample={handleStartFirstExample}
            onOpenGuide={handleOpenGuide}
          />
        )}

        {activeScreen === 'scenario' && (
          <ScenarioView
            key={`${activeScenario.id}-${sessionCounter}`}
            scenario={activeScenario}
            soundEnabled={soundEnabled}
            isGuideOpen={isGuideOpen}
            onSelectScenario={handleSelectScenario}
            onGoHome={handleGoHome}
            onOpenEvaluation={handleOpenEvaluation}
            onFirstAction={dismissCoachmark}
          />
        )}

        {activeScreen === 'evaluation' && (
          <EvaluationView
            scenario={activeScenario}
            altBranchesUsed={lastAltBranchesUsed}
            playedHistory={lastPlayedHistory}
            isGuideOpen={isGuideOpen}
            onGoHome={handleGoHome}
            onRestartScenario={handleRestartScenario}
          />
        )}
      </div>

      <footer className="border-t border-slate-200 bg-slate-50/50 py-5">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          <span>STIMIT · Демо-стенд агентной AI-поддержки клиентов</span>
          <button
            type="button"
            onClick={handleOpenGuide}
            className="font-medium text-[#1B3A6B] hover:underline cursor-pointer"
          >
            Архитектура и правила 6 агентов
          </button>
        </div>
      </footer>

      {/* First-entry coach-mark bubble floating over the screen; disappears on first action */}
      <AnimatePresence>
        {showCoachmark && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-4 left-4 z-40 mx-auto max-w-sm sm:left-auto sm:right-6"
          >
            <div className="relative flex items-start gap-3 rounded-2xl border border-[#1B3A6B]/25 bg-white p-4 shadow-xl ring-1 ring-slate-900/5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1B3A6B] text-white">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex-1 pr-2">
                <p className="text-sm font-semibold leading-snug text-slate-900">
                  Вы отвечаете за клиента. Выбирайте реплики — и смотрите, как думают агенты
                </p>
              </div>
              <button
                type="button"
                onClick={dismissCoachmark}
                aria-label="Скрыть подсказку"
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SystemGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
