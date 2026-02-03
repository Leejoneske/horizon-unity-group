import { 
  Users, 
  TrendingUp, 
  Calendar, 
  CheckCircle2 
} from 'lucide-react';

interface StatsOverviewProps {
  membersCount: number;
  totalGroupSavings: number;
  thisMonthTotal: number;
  thisMonthContribsCount: number;
}

export default function StatsOverview({ 
  membersCount, 
  totalGroupSavings, 
  thisMonthTotal, 
  thisMonthContribsCount 
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="finance-card">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="stat-label">Members</span>
        </div>
        <p className="stat-value">{membersCount}</p>
      </div>
      <div className="finance-card">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="stat-label">Total Savings</span>
        </div>
        <p className="stat-value text-xl lg:text-3xl">KES {totalGroupSavings.toLocaleString()}</p>
      </div>
      <div className="finance-card">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="stat-label">This Month</span>
        </div>
        <p className="stat-value text-xl lg:text-3xl">KES {thisMonthTotal.toLocaleString()}</p>
      </div>
      <div className="finance-card">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="stat-label">Contributions</span>
        </div>
        <p className="stat-value">{thisMonthContribsCount}</p>
      </div>
    </div>
  );
}
