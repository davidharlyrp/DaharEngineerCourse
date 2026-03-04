interface ProgressBarProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ 
  percentage, 
  size = 'md', 
  showLabel = true,
  className = '' 
}: ProgressBarProps) {
  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm font-medium text-army-400">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-dark-800 ${heightClass}`}>
        <div
          className={`bg-army-600 ${heightClass} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
}
