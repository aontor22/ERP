import React, { useId, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface SparklinePoint {
  label?: string;
  value: number;
}

export interface KpiSparklineProps {
  data: (number | SparklinePoint)[];
  width?: number;
  height?: number;
  favorable?: boolean;
  color?: string; // Optional custom color override
  id?: string;
  tooltipPrefix?: string;
  formatValue?: (val: number) => string;
  className?: string;
}

export const KpiSparkline: React.FC<KpiSparklineProps> = ({
  data,
  width = 54,
  height = 22,
  favorable,
  color,
  id,
  tooltipPrefix = 'Trend',
  formatValue = (v) => v.toLocaleString(),
  className = '',
}) => {
  const gradientId = useId().replace(/:/g, '-');

  // Extract raw numerical values and labels
  const points = useMemo(() => {
    return data.map((d, i) => {
      if (typeof d === 'number') {
        return { value: d, label: `Point ${i + 1}` };
      }
      return { value: d.value, label: d.label || `Point ${i + 1}` };
    });
  }, [data]);

  const {
    pathD,
    areaD,
    lastPoint,
    firstPoint,
    isUpward,
    percentChange,
    strokeColor,
    fillColorStart,
    minVal,
    maxVal,
  } = useMemo(() => {
    if (!points || points.length === 0) {
      return {
        pathD: '',
        areaD: '',
        lastPoint: { x: 0, y: 0, val: 0 },
        firstPoint: { x: 0, y: 0, val: 0 },
        isUpward: true,
        percentChange: 0,
        strokeColor: '#10b981',
        fillColorStart: 'rgba(16, 185, 129, 0.25)',
        minVal: 0,
        maxVal: 0,
      };
    }

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Upward vs downward trend determined by trajectory from start to finish
    const firstVal = values[0];
    const lastVal = values[values.length - 1];
    const upward = lastVal >= firstVal;
    const diff = lastVal - firstVal;
    const pct = firstVal !== 0 ? (diff / Math.abs(firstVal)) * 100 : 0;

    // Pick stroke & fill colors based on favorability / trend
    // If favorable is explicitly provided, respect it; otherwise use direction
    const isGood = favorable !== undefined ? favorable : upward;

    let stroke = color;
    if (!stroke) {
      stroke = isGood ? '#10b981' : '#f43f5e'; // Emerald or Rose
    }

    let fill = isGood ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
    if (color) {
      fill = color.startsWith('#')
        ? `${color}33` // 20% hex opacity
        : color;
    }

    // Coordinates mapping with 2px horizontal padding and 3px vertical padding
    const paddingX = 3;
    const paddingY = 3;
    const effectiveWidth = Math.max(1, width - paddingX * 2);
    const effectiveHeight = Math.max(1, height - paddingY * 2);
    const stepX = effectiveWidth / Math.max(1, points.length - 1);

    const coords = points.map((p, idx) => {
      const x = paddingX + idx * stepX;
      // In SVG y=0 is at top, so higher value gets smaller y
      const y = paddingY + effectiveHeight - ((p.value - min) / range) * effectiveHeight;
      return { x, y, val: p.value, label: p.label };
    });

    // Create smooth bezier curve path
    let lineD = '';
    if (coords.length === 1) {
      lineD = `M ${coords[0].x} ${coords[0].y} L ${coords[0].x + 1} ${coords[0].y}`;
    } else if (coords.length === 2) {
      lineD = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)} L ${coords[1].x.toFixed(1)} ${coords[1].y.toFixed(1)}`;
    } else {
      lineD = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[Math.max(0, i - 1)];
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const p3 = coords[Math.min(coords.length - 1, i + 2)];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        lineD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
    }

    const last = coords[coords.length - 1];
    const first = coords[0];
    const area = `${lineD} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`;

    return {
      pathD: lineD,
      areaD: area,
      lastPoint: last,
      firstPoint: first,
      isUpward: upward,
      percentChange: pct,
      strokeColor: stroke,
      fillColorStart: fill,
      minVal: min,
      maxVal: max,
    };
  }, [points, width, height, favorable, color]);

  if (!points || points.length === 0) {
    return null;
  }

  const tooltipText = `${tooltipPrefix}: ${points.length} periods historical movement (${isUpward ? '↗ Upward' : '↘ Downward'} ${Math.abs(percentChange).toFixed(1)}%)\nStart: ${formatValue(firstPoint.val)} (${points[0].label})\nLatest: ${formatValue(lastPoint.val)} (${points[points.length - 1].label})\nLow: ${formatValue(minVal)} | High: ${formatValue(maxVal)}`;

  return (
    <div
      id={id}
      title={tooltipText}
      className={`relative inline-flex items-center shrink-0 cursor-help select-none group ${className}`}
      role="img"
      aria-label={`${tooltipPrefix} sparkline: ${isUpward ? 'Upward' : 'Downward'} trendline`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`sparkline-grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle background baseline guide */}
        <line
          x1="2"
          y1={height - 2}
          x2={width - 2}
          y2={height - 2}
          stroke="currentColor"
          className="text-slate-200/60 dark:text-slate-800/60"
          strokeWidth="0.75"
          strokeDasharray="2 2"
        />

        {/* Subtle filled area beneath sparkline */}
        <path
          d={areaD}
          fill={`url(#sparkline-grad-${gradientId})`}
          className="transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Smooth trendline curve */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300 group-hover:stroke-[2]"
        />

        {/* Starting reference subtle dot */}
        <circle
          cx={firstPoint.x}
          cy={firstPoint.y}
          r="1.25"
          fill={strokeColor}
          opacity="0.4"
        />

        {/* End-point active pulse dot */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2.25"
          fill={strokeColor}
          className="transition-transform duration-200 group-hover:scale-125"
        />
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="4"
          fill={strokeColor}
          opacity="0.2"
        />
      </svg>
    </div>
  );
};
