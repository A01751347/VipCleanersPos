// components/admin/DashboardCard.tsx
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  iconColor,
  iconBg,
  loading = false
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={16} className="text-green-500" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-red-500" />;
    return <Minus size={16} className="text-gray-500" />;
  };

  const getTrendClass = () => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-xl border border-[#e0e6e5] p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between">
        <div>
          <p className="text-[#6c7a89] text-sm font-medium mb-2">{title}</p>
          {loading ? (
            <div className="h-9 flex items-center">
              <Loader2 size={24} className="animate-spin text-[#78f3d3]" />
            </div>
          ) : (
            <h3 className="text-[#313D52] text-2xl font-bold">{value}</h3>
          )}
          {!loading && change && (
            <div className="flex items-center mt-2">
              {getTrendIcon()}
              <span className={`text-xs ml-1 ${getTrendClass()}`}>{change}</span>
              <span className="text-xs text-[#6c7a89] ml-1">vs. mes anterior</span>
            </div>
          )}
        </div>
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;