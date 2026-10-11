import React, { useId } from 'react';

export const CircularGauge = ({
  value = 0,
  max = 100,
  size = 90,
  strokeWidth = 8,
  label = '',
  subLabel = '',
  accentColor = '#8B5CF6',
  secondaryColor = '#38BDF8',
  icon: Icon = null,
  isThemeDay = false,
}) => {
  const rawId = useId();
  const gradientId = `gauge-gradient-${rawId.replace(/:/g, '')}`;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accentColor} />
              <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>
          </defs>
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isThemeDay ? '#CBD5E1' : '#27272A'}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {Icon && <Icon className="w-3.5 h-3.5 mb-0.5 opacity-80" style={{ color: accentColor }} />}
          <span className={`text-base font-bold tracking-tight leading-none tabular-nums ${
            isThemeDay ? 'text-slate-900' : 'text-white'
          }`}>
            {value}
            {max === 100 && subLabel === '%' ? '%' : ''}
          </span>
          {subLabel && subLabel !== '%' && (
            <span className={`text-[10px] font-semibold uppercase mt-0.5 tracking-wider ${
              isThemeDay ? 'text-slate-500' : 'text-zinc-400'
            }`}>{subLabel}</span>
          )}
        </div>
      </div>

      {label && (
        <span className={`text-xs font-semibold mt-1.5 text-center ${
          isThemeDay ? 'text-slate-600' : 'text-zinc-400'
        }`}>
          {label}
        </span>
      )}
    </div>
  );
};
