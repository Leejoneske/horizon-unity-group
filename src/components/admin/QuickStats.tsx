import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, DollarSign, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

interface AnalyticsData {
  totalMembers: number;
  activeMembers: number;
  thisMonthSavings: number;
  pendingWithdrawals: number;
  completionRate: number;
  averageContribution: number;
}

interface QuickStatsProps {
  adminId: string;
}

export default function QuickStats({ adminId }: QuickStatsProps) {
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [adminId]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      // Fetch contributions this month
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { data: contributionsData } = await supabase
        .from('contributions')
        .select('*')
        .gte('contribution_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('contribution_date', format(monthEnd, 'yyyy-MM-dd'));

      // Fetch pending withdrawals
      const { data: withdrawalsData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('status', 'pending');

      if (profilesData && contributionsData) {
        const nonAdminProfiles = profilesData.filter((p: any) => p.user_id !== adminId) || [];
        const activeCount = nonAdminProfiles.filter((p: any) => p.status === 'active').length;
        const thisMonthTotal = contributionsData.reduce((sum, c: any) => sum + Number(c.amount), 0);
        const avgContrib = contributionsData.length > 0 ? thisMonthTotal / contributionsData.length : 0;
        const completionRate = nonAdminProfiles.length > 0 
          ? Math.round((contributionsData.length / (nonAdminProfiles.length * 30)) * 100)
          : 0;

        setStats({
          totalMembers: nonAdminProfiles.length,
          activeMembers: activeCount,
          thisMonthSavings: thisMonthTotal,
          pendingWithdrawals: withdrawalsData?.length || 0,
          completionRate: Math.min(completionRate, 100),
          averageContribution: Math.round(avgContrib)
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="px-4 pb-6">
        <div className="text-center py-8 text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  const quickStats: QuickStat[] = [
    {
      label: 'Total Members',
      value: stats.totalMembers,
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-400 to-blue-600',
      trend: `${stats.activeMembers} active`
    },
    {
      label: 'This Month',
      value: `KES ${stats.thisMonthSavings.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-green-400 to-green-600',
      trend: `Avg: ${stats.averageContribution.toLocaleString()}`
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'from-emerald-400 to-emerald-600'
    },
    {
      label: 'Pending Withdrawals',
      value: stats.pendingWithdrawals,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'from-orange-400 to-orange-600',
      trend: stats.pendingWithdrawals > 0 ? 'Needs review' : 'None'
    }
  ];

  return (
    <div className="px-4 pb-6">
      <h3 className="text-lg font-semibold text-gray-600 mb-4">Quick Stats</h3>
      <div className="grid grid-cols-2 gap-3">
        {quickStats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-gray-300 transition">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
              {stat.icon}
            </div>
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{stat.value}</p>
            {stat.trend && (
              <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
