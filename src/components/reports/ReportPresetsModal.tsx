import React, { useState } from 'react';
import {
  Bookmark,
  X,
  Check,
  Trash2,
  Star,
  Layers,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  RotateCcw,
  Plus,
  Save,
} from 'lucide-react';
import {
  ReportPreset,
  EntitySegmentFilter,
} from './reportPresets.js';
import { DateRange } from './ReportDateRangePicker.js';

interface ReportPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePresetId: string | null;
  presets: ReportPreset[];
  currentDateRange: DateRange;
  currentEntitySegment: EntitySegmentFilter;
  currentReportType: string;
  onSelectPreset: (preset: ReportPreset) => void;
  onSaveNewPreset: (presetData: {
    name: string;
    description: string;
    isDefault: boolean;
  }) => void;
  onDeletePreset: (presetId: string) => void;
  onSetDefaultPreset: (presetId: string) => void;
  onResetToDefaults: () => void;
  initialTab?: 'save' | 'manage';
}

export const ReportPresetsModal: React.FC<ReportPresetsModalProps> = ({
  isOpen,
  onClose,
  activePresetId,
  presets,
  currentDateRange,
  currentEntitySegment,
  currentReportType,
  onSelectPreset,
  onSaveNewPreset,
  onDeletePreset,
  onSetDefaultPreset,
  onResetToDefaults,
  initialTab = 'save',
}) => {
  const [activeTab, setActiveTab] = useState<'save' | 'manage'>(initialTab);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSaveError('Please enter a descriptive name for this preset.');
      return;
    }
    setSaveError('');
    onSaveNewPreset({
      name: name.trim(),
      description: description.trim(),
      isDefault,
    });
    setName('');
    setDescription('');
    setIsDefault(false);
    onClose();
  };

  const formatTabName = (type: string) => {
    switch (type) {
      case 'financial':
        return 'Trial Balance & Financial Position';
      case 'sales':
        return 'NBR VAT-9.1 Return & Revenue';
      case 'inventory':
        return 'Stock Valuation & Turnover';
      case 'payroll':
        return 'Payroll & TDS Withholding';
      case 'analytics':
        return 'Executive Trends & Analytics';
      default:
        return 'Financial Reports';
    }
  };

  return (
    <div
      id="report-presets-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="report-presets-modal"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Report Presets
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                Save and load common date range and entity segment configurations
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-presets-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-2 bg-slate-50/30 dark:bg-slate-900/50">
          <button
            type="button"
            id="tab-save-preset"
            onClick={() => setActiveTab('save')}
            className={`pb-2.5 px-3 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'save'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Current Configuration</span>
          </button>

          <button
            type="button"
            id="tab-manage-presets"
            onClick={() => setActiveTab('manage')}
            className={`pb-2.5 px-3 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'manage'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manage Presets ({presets.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'save' ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Configuration Preview Card */}
              <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                <div className="flex items-center justify-between text-3xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                  <span>Configuration Captured</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">Live Snapshot</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-3xs">Period:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{currentDateRange.label}</strong>
                      <span className="text-3xs font-mono text-slate-500 dark:text-slate-400 block">
                        {currentDateRange.startDate} → {currentDateRange.endDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-3xs">Legal Entity:</span>
                      <strong className="text-slate-800 dark:text-slate-200 truncate block">
                        {currentEntitySegment.entityName}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-3xs">Operating Segment:</span>
                      <strong className="text-slate-800 dark:text-slate-200 truncate block">
                        {currentEntitySegment.segmentName}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-3xs">Default Report View:</span>
                      <strong className="text-slate-800 dark:text-slate-200 truncate block">
                        {formatTabName(currentReportType)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preset Name Field */}
              <div>
                <label
                  htmlFor="preset-name-input"
                  className="block text-2xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                >
                  Preset Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="preset-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (saveError) setSaveError('');
                  }}
                  placeholder="e.g. Q3 Textile Export Audit, Logistics Last 90D"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-xs"
                />
                {saveError && (
                  <p className="mt-1 text-2xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{saveError}</span>
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label
                  htmlFor="preset-description-input"
                  className="block text-2xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="preset-description-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes on statutory purpose, scope or regulatory filing requirements..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-xs"
                />
              </div>

              {/* Default Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="preset-default-checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Set as default startup preset
                  </span>
                  <span className="text-3xs text-slate-500 dark:text-slate-400">
                    Automatically applies this filter combination whenever ReportsView opens
                  </span>
                </div>
              </label>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-preset-submit-btn"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preset</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Available Presets ({presets.length})
                </span>
                <button
                  type="button"
                  onClick={onResetToDefaults}
                  className="text-3xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Revert presets back to built-in system standards"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All to Defaults</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
                {presets.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {preset.name}
                            </span>
                            {preset.isSystem ? (
                              <span className="text-3xs px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium shrink-0">
                                System
                              </span>
                            ) : (
                              <span className="text-3xs px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded font-medium shrink-0">
                                Custom
                              </span>
                            )}
                            {preset.isDefault && (
                              <span className="text-3xs px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded font-medium flex items-center gap-0.5 shrink-0">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span>Default</span>
                              </span>
                            )}
                          </div>
                          {preset.description && (
                            <p className="text-3xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                              {preset.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-3xs font-mono text-slate-500 dark:text-slate-400">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                              📅 {preset.dateRange.label}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                              🏢 {preset.entitySegment.entityName}
                            </span>
                            {preset.entitySegment.segmentId !== 'all' && (
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                🏷️ {preset.entitySegment.segmentName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPreset(preset);
                              onClose();
                            }}
                            className={`px-2.5 py-1 rounded-md font-bold text-2xs transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isActive ? 'Active' : 'Load'}
                          </button>

                          {!preset.isDefault && (
                            <button
                              type="button"
                              onClick={() => onSetDefaultPreset(preset.id)}
                              title="Set as default startup preset"
                              className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!preset.isSystem && (
                            <button
                              type="button"
                              onClick={() => onDeletePreset(preset.id)}
                              title="Delete custom preset"
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-3xs text-slate-400">
                  Presets are securely persisted in browser LocalStorage.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('save')}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-2xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Preset</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
