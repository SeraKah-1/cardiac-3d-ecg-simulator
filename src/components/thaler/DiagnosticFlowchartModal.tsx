/**
 * DiagnosticFlowchartModal: Native Interactive EKG Interpretation Roadmap
 * Replaces bloated, microscopic Mermaid diagrams with an accessible,
 * high-performance, responsive React decision-tree overlay.
 * Features stage filtering, instant search, and deep-link step jumping.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  ArrowRight,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import {
  THALER_FLOWCHART_STAGES,
  FlowchartStage,
  FlowchartBranch,
} from '../../engine/clinical/thaler/thalerFlowchartData';
import { getLocalizedFlowchartStages } from '../../engine/clinical/thaler/thalerLocalization';
import { ClinicalFormula } from '../ui/ClinicalFormula';
import { useLocale } from '../../locales/useLocale';

interface DiagnosticFlowchartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToTutorial: (caseId: string, stepNumber: number) => void;
  currentCaseId?: string;
}

export const DiagnosticFlowchartModal: React.FC<DiagnosticFlowchartModalProps> = ({
  isOpen,
  onClose,
  onJumpToTutorial,
}) => {
  const { t, locale } = useLocale();
  const [selectedStageId, setSelectedStageId] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Localized stages projection
  const localizedStages = useMemo(() => {
    return getLocalizedFlowchartStages(THALER_FLOWCHART_STAGES, locale);
  }, [locale]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter stages and nodes based on selected tab and search query
  const filteredStages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return localizedStages.filter((stage) => {
      if (selectedStageId !== 'ALL' && stage.stageId !== selectedStageId) {
        return false;
      }
      return true;
    })
      .map((stage) => {
        if (!query) return stage;

        const matchingNodes = stage.nodes.filter((node) => {
          const titleMatch = node.questionTitle.toLowerCase().includes(query);
          const directiveMatch = node.clinicalDirective.toLowerCase().includes(query);
          const leadMatch = node.keyLeads.some((l) => l.toLowerCase().includes(query));
          const branchMatch = node.branches.some(
            (b) =>
              b.label.toLowerCase().includes(query) ||
              b.finding.toLowerCase().includes(query) ||
              b.diagnosticOutcome.toLowerCase().includes(query)
          );
          return titleMatch || directiveMatch || leadMatch || branchMatch;
        });

        return {
          ...stage,
          nodes: matchingNodes,
        };
      })
      .filter((stage) => stage.nodes.length > 0);
  }, [selectedStageId, searchQuery]);

  if (!isOpen) return null;

  const fc = t.flowchart;

  const getStatusBadge = (status: FlowchartBranch['status']) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{fc.statusNormal}</span>
          </span>
        );
      case 'PATHOLOGIC':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            <span>{fc.statusPathologic}</span>
          </span>
        );
      case 'WARNING':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>{fc.statusWarning}</span>
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-2 sm:p-6 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[92dvh] bg-white rounded-xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header Bar */}
        <div className="h-14 bg-white border-b border-stone-200 px-3 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                  {fc.modalTitle}
                </h2>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {fc.modalBadge}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                {fc.modalSubtitle}
              </p>
            </div>
          </div>

          {/* Search Box & Close Button */}
          <div className="flex items-center space-x-2">
            <div className="relative w-36 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder={fc.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-stone-50 hover:bg-stone-100 focus:bg-white text-base sm:text-xs border border-stone-200 rounded-md focus:outline-none focus:border-blue-500 font-sans transition"
              />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
              title={t.common.closeEsc}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Stage Filter Navigation Tabs */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-6 py-2 flex items-center space-x-1.5 overflow-x-auto no-scrollbar shrink-0 select-none">
          <button
            onClick={() => setSelectedStageId('ALL')}
            className={`px-3 py-1 rounded-md text-xs font-sans whitespace-nowrap transition cursor-pointer ${
              selectedStageId === 'ALL'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200 font-medium'
            }`}
          >
            {fc.allStages}
          </button>
          {localizedStages.map((stage) => {
            const isActive = selectedStageId === stage.stageId;
            return (
              <button
                key={stage.stageId}
                onClick={() => setSelectedStageId(stage.stageId)}
                className={`px-3 py-1 rounded-md text-xs font-sans whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200 font-medium'
                }`}
              >
                {stage.stageId === 0
                  ? fc.stage0Label
                  : `${fc.stagePrefix} ${stage.stageId}: ${stage.stageName.split(':')[1]?.split('(')[0] || stage.stageName}`}
              </button>
            );
          })}
        </div>

        {/* 3. Main Decision Flow Canvas (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-stone-100/60">
          {filteredStages.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 text-stone-400" />
              <p className="text-sm font-medium">{fc.emptySearch(searchQuery)}</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                {fc.resetSearch}
              </button>
            </div>
          ) : (
            filteredStages.map((stage: FlowchartStage) => (
              <section key={stage.stageId} className="space-y-3">
                {/* Stage Banner */}
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-700">
                    {stage.stageName}
                  </h3>
                </div>

                {/* Nodes Grid within Stage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stage.nodes.map((node) => (
                    <div
                      key={node.id}
                      className="bg-white rounded-lg border border-stone-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      {/* Node Header & Question */}
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-stone-900 leading-snug">
                            {node.questionTitle}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0">
                            {node.keyLeads.map((lead) => (
                              <span
                                key={lead}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200"
                              >
                                {lead}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Clinical Directive (What to look for) */}
                        <p className="text-xs text-stone-600 leading-relaxed">
                          <strong className="text-stone-700">{fc.directiveLabel}</strong>
                          {node.clinicalDirective}
                        </p>

                        {/* Optional Embedded Clinical Formula */}
                        {node.formula && (
                          <div className="pt-1.5">
                            <ClinicalFormula tex={node.formula} />
                          </div>
                        )}
                      </div>

                      {/* Decision Branches (Outcomes) */}
                      <div className="space-y-2 pt-2 border-t border-stone-100">
                        {node.branches.map((branch, idx) => (
                          <div
                            key={idx}
                            className="bg-stone-50 rounded-md p-2.5 border border-stone-200 space-y-1 hover:border-stone-300 transition"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-stone-800">
                                {branch.label}
                              </span>
                              {getStatusBadge(branch.status)}
                            </div>

                            <div className="text-[11px] text-stone-600">
                              <span className="text-stone-500 font-mono">{fc.outcomeLabel}</span>
                              <strong className="text-stone-800">{branch.finding}</strong>
                              {branch.diagnosticOutcome && (
                                <span className="text-stone-600"> &rarr; {branch.diagnosticOutcome}</span>
                              )}
                            </div>

                            {/* Jump to Case Button */}
                            {branch.tutorialCaseId && (
                              <button
                                onClick={() =>
                                  onJumpToTutorial(
                                    branch.tutorialCaseId!,
                                    branch.suggestedStep || stage.stageId + 1
                                  )
                                }
                                className="mt-1 inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                              >
                                <span>{fc.jumpToTutorial}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* 4. Modal Footer */}
        <div className="h-12 bg-white border-t border-stone-200 px-4 sm:px-6 flex items-center justify-between text-xs shrink-0">
          <span className="text-stone-500">
            {fc.sourceCitation}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition cursor-pointer"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
