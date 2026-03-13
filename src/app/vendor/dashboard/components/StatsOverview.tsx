import { Users, Calendar, CheckCircle, UserX, UserPlus } from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    waiting: number;
    completed: number;
    noShow: number;
    total: number;
  };
  onAddWalkIn: () => void;
}

export default function StatsOverview({ stats, onAddWalkIn }: StatsOverviewProps) {
  const cards = [
    {
      label: 'Waiting List',
      value: stats.waiting,
      icon: Users,
      color: 'violet',
      bg: 'bg-violet-500/10',
      text: 'text-violet-500'
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'emerald',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-500'
    },
    {
      label: 'No Shows',
      value: stats.noShow,
      icon: UserX,
      color: 'rose',
      bg: 'bg-rose-500/10',
      text: 'text-rose-500'
    },
    {
      label: 'Total Today',
      value: stats.total,
      icon: Calendar,
      color: 'cyan',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-500'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <button 
        onClick={onAddWalkIn}
        className="glass-panel p-6 flex items-center justify-between border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500 rounded-xl text-white shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
            <UserPlus size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">Add Walk-in</h3>
            <p className="text-xs text-foreground-muted uppercase tracking-wider font-bold">New manual booking</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover:translate-x-1 transition-transform">
          <UserPlus size={18} className="text-foreground-muted" />
        </div>
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6 flex-1">
        {cards.map((card) => (
          <div key={card.label} className="glass-panel p-6 flex items-center space-x-4">
            <div className={`p-4 ${card.bg} rounded-2xl ${card.text}`}>
              <card.icon size={28} />
            </div>
            <div>
              <p className="text-sm text-foreground-muted font-medium">{card.label}</p>
              <h3 className="text-3xl font-bold">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
