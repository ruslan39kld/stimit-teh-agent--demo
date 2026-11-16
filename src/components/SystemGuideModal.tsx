import React, { useEffect } from 'react';
import { X, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  GENERAL_SYSTEM_RULES,
  PROFILE_FIELDS_SPEC,
  ROUTING_RULES,
  SYSTEM_AGENTS,
} from '../data/systemArchitecture';

interface SystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemGuideModal: React.FC<SystemGuideModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-6 lg:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="system-guide-title"
      onClick={onClose}
    >
      <div
        className="relative my-4 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-2xl border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-medium text-slate-500">Архитектура STIMIT</p>
            <h2 id="system-guide-title" className="font-display text-xl sm:text-2xl font-bold text-[#1B3A6B]">
              Как устроена мультиагентная система
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть справку"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-8 p-5 sm:p-8">
          <section>
            <h3 className="font-display text-base font-bold text-slate-900">
              Конвейер обработки каждого сообщения
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Перед каждым ответом система строго последовательно проходит три этапа. Нельзя смешивать роли агентов и нельзя пропускать этапы конвейера.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="rounded-lg bg-[#1B3A6B] px-3 py-1.5 text-xs font-semibold text-white">
                1. Агент-Профайлер
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span className="rounded-lg bg-[#1B3A6B] px-3 py-1.5 text-xs font-semibold text-white">
                2. Агент-Маршрутизатор
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span className="rounded-lg border border-[#1B3A6B]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#1B3A6B]">
                3. Финальный агент: Диагност / Навигатор / Консультант / Финализатор
              </span>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h3 className="font-display text-base font-bold text-slate-900">
              6 агентов системы и их специализация
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {SYSTEM_AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-display text-base font-bold text-[#1B3A6B]">
                      {agent.order}. {agent.name}
                    </h4>
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      {agent.stage}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{agent.summary}</p>
                  <ul className="mt-3 space-y-1.5 border-t border-slate-200/80 pt-3 text-xs leading-relaxed text-slate-600">
                    {agent.details.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B3A6B]/60" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h3 className="font-display text-base font-bold text-slate-900">
              7 полей профиля клиента (Агент-Профайлер)
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Профайлер обновляет все семь параметров перед каждым ответом, чтобы Маршрутизатор и финальный агент опирались на факты.
            </p>
            <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {PROFILE_FIELDS_SPEC.map((field, index) => (
                <div
                  key={field.key}
                  className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-12 sm:items-baseline sm:gap-4"
                >
                  <div className="sm:col-span-4 text-sm font-semibold text-slate-900">
                    <span className="font-mono-tabular mr-2 text-xs text-slate-400">
                      0{index + 1}
                    </span>
                    {field.label}
                  </div>
                  <div className="sm:col-span-8 text-sm text-slate-600">{field.description}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h3 className="font-display text-base font-bold text-slate-900">
              Правила Агента-Маршрутизатора
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROUTING_RULES.map((rule) => (
                <div
                  key={rule.agent}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="font-display text-sm font-bold text-[#1B3A6B]">
                    {rule.agent}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{rule.condition}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#1B3A6B]" aria-hidden="true" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Общие правила системы
              </h3>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {GENERAL_SYSTEM_RULES.map((rule, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800"
                >
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50/70 px-5 py-4 rounded-b-2xl sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#1B3A6B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#142C52] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] focus-visible:ring-offset-2"
          >
            Понятно, вернуться к стенду
          </button>
        </div>
      </div>
    </div>
  );
};
