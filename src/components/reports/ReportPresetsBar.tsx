import React, { useState, useRef, useEffect } from 'react';
import {
  Bookmark,
  ChevronDown,
  Plus,
  Settings2,
  Check,
  RotateCcw,
  Sparkles,
  Star,
  Layers,
  Calendar,
  Building2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  ReportPreset,
  EntitySegmentFilter,
  isFilterMatchingPreset,
} from './reportPresets.js';
import { DateRange } from './ReportDateRangePicker.js';

interface ReportPresetsBarProps {
  presets: ReportPreset[];
  activePresetId: string | null;
  currentDateRange: DateRange;
  currentEntitySegment: EntitySegmentFilter;
  onSelectPreset: (preset: ReportPreset) => void;
  onOpenSaveModal: () => void;
  onOpenManageModal: () => void;
  onRevertToActivePreset: () => void;
  className?: string;
}

export const ReportPresetsBar: React.FC<ReportPresetsBarProps> = ({
  presets,
  activePresetId,
  currentDateRange,
  currentEntitySegment,
  onSelectPreset,
  onOpenSaveModal,
  onOpenManageModal,
  onRevertToActivePreset,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activePreset = presets.find((p) => p.id === activePresetId);
  const isMatching = activePreset
    ? isFilterMatchingPreset(currentDateRange, currentEntitySegment, activePreset)
    : false;
  const isModified = activePreset && !isMatching;

  const systemPresets = presets.filter((p) => p.isSystem);
  const userPresets = presets.filter((p) => !p.isSystem);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Preset Selector Trigger Button */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          id="report-preset-selector-trigger"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
            activePreset
              ? 'bg-indigo-50/60 border-indigo-300 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-700 dark:text-indigo-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
          }`}
          title="Load saved report presets or save current filter configuration"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
            <Bookmark className="w-3.5 h-3.5" />
          </div>

          <div className="text-left flex flex-col max-w-[160px] sm:max-w-[200px]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {activePreset ? activePreset.name : 'Report Presets'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-3xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="text-slate-400">Preset:</span>
              <span className="truncate">
                {isModified ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">● Modified</span>
                ) : activePreset ? (
                  <span className="text-indigo-600 dark:text-indigo-400">Applied</span>
                ) : (
                  'Custom Selection'
                )}
              </span>
            </div>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ml-1 ${
              isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
            }`}
          />
        </button>

        {/* Quick 'Save as Preset' or 'Revert' chip if modified */}
        {isModified && (
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenSaveModal}
              id="quick-save-preset-btn"
              title="Save these modified filter settings as a new Report Preset"
              className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-3xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Save as New</span>
            </button>
            <button
              type="button"
              onClick={onRevertToActivePreset}
              title="Revert back to the original preset values"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Preset Dropdown Menu */}
      {isOpen && (
        <div
          id="report-presets-dropdown-menu"
          className="absolute right-0 sm:left-0 z-50 mt-1.5 w-[330px] sm:w-[380px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150 text-xs"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-slate-900 dark:text-white">
                Saved Report Presets
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenManageModal}
              className="text-3xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Settings2 className="w-3 h-3" />
              <span>Manage ({presets.length})</span>
            </button>
          </div>

          {/* User Presets (if any) */}
          {userPresets.length > 0 && (
            <div className="py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-3xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400 block mb-1.5">
                My Custom Presets ({userPresets.length})
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                {userPresets.map((preset) => {
                  const isSelected = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onSelectPreset(preset);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-start justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500 font-semibold'
                          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">{preset.name}</span>
                          {preset.isDefault && (
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="text-3xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                          {preset.dateRange.label} • {preset.entitySegment.entityName}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* System Standard Presets */}
          <div className="py-2.5">
            <span className="text-3xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block mb-1.5">
              Standard Enterprise Presets
            </span>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
              {systemPresets.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500 font-semibold'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold truncate">{preset.name}</span>
                        {preset.isDefault && (
                          <span className="text-3xs px-1 py-0.2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded font-medium shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-3xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                        {preset.dateRange.label} • {preset.entitySegment.entityName}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSaveModal();
              }}
              id="save-current-filter-as-preset-btn"
              className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-2xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              <span>Save Current as Preset</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenManageModal();
              }}
              className="py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-2xs font-semibold transition-colors cursor-pointer"
              title="View, edit, or remove custom presets"
            >
              Manage
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
