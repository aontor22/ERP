import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  ChevronDown,
  Check,
  Globe2,
  Factory,
  Ship,
  Landmark,
  Layers,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import {
  EntitySegmentFilter,
  ENTITY_OPTIONS,
  SEGMENT_OPTIONS,
  EntityOption,
  SegmentOption,
} from './reportPresets.js';

interface EntitySegmentPickerProps {
  value: EntitySegmentFilter;
  onChange: (nextValue: EntitySegmentFilter) => void;
  className?: string;
}

export const EntitySegmentPicker: React.FC<EntitySegmentPickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const activeEntity = ENTITY_OPTIONS.find((e) => e.id === value.entityId) || ENTITY_OPTIONS[0];
  const activeSegment = SEGMENT_OPTIONS.find((s) => s.id === value.segmentId) || SEGMENT_OPTIONS[0];

  const handleSelectEntity = (entity: EntityOption) => {
    onChange({
      ...value,
      entityId: entity.id,
      entityName: entity.name,
    });
  };

  const handleSelectSegment = (segment: SegmentOption) => {
    onChange({
      ...value,
      segmentId: segment.id,
      segmentName: segment.name,
    });
  };

  const getEntityIcon = (entityId: string) => {
    switch (entityId) {
      case 'all':
        return <Globe2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'comp-textile':
        return <Factory className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'comp-logistics':
        return <Ship className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />;
      case 'comp-apex-group':
        return <Landmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Entity & Segment Trigger Button */}
      <button
        type="button"
        id="entity-segment-picker-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
          value.entityId !== 'all' || value.segmentId !== 'all'
            ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-400/40'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
        title="Segment financial and operational metrics by legal entity and operational division"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
          {getEntityIcon(value.entityId)}
        </div>

        <div className="text-left flex flex-col max-w-[190px] sm:max-w-[240px]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {activeEntity.name}
            </span>
          </div>
          <div className="flex items-center gap-1 text-3xs text-slate-500 dark:text-slate-400 font-medium truncate">
            <span className="text-slate-400 dark:text-slate-500">Segment:</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 truncate">
              {activeSegment.name}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ml-1 ${
            isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          id="entity-segment-popover"
          className="absolute right-0 sm:left-0 z-50 mt-1.5 w-[330px] sm:w-[420px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150 text-xs"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-slate-900 dark:text-white">
                Entity & Operating Segment Filter
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
              title="Close entity picker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section 1: Legal Entity Selection */}
          <div className="py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                1. Legal Corporate Entity
              </span>
              <span className="text-3xs text-slate-400 font-mono">
                {activeEntity.code}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
              {ENTITY_OPTIONS.map((entity) => {
                const isSelected = value.entityId === entity.id;
                return (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => handleSelectEntity(entity)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500 font-semibold'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getEntityIcon(entity.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">{entity.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </div>
                      <div className="text-3xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {entity.taxId} • {entity.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Operating Division / Segment */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                2. Operational Division / Segment
              </span>
              <span className="text-3xs text-slate-400 font-mono">
                {activeSegment.code}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
              {SEGMENT_OPTIONS.map((segment) => {
                const isSelected = value.segmentId === segment.id;
                return (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() => handleSelectSegment(segment)}
                    className={`flex items-start gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500 font-semibold'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold truncate">{segment.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </div>
                      <div className="text-3xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {segment.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-3xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
              <Info className="w-3 h-3 text-indigo-500 shrink-0" />
              <span className="truncate">
                Segment applies to revenue, stock valuation, and payroll.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-2xs font-bold transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
