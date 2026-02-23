import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Target, Award } from 'lucide-react';

interface AnalyticsDashboardProps {
  members: any[];
  contributions: any[];
  totalSavings: number;
}

export default function AnalyticsDashboard({ members, contributions, totalSavings }: AnalyticsDashboardProps) {
  const metrics = useMemo(() => {
    const activeCount = members.filter(m => m.member_status === 'active').length;
    const contributionRate = members.length > 0 ? (contributions.length / (members.length * 30)) * 100 : 0;
    const avgContribution = contributions.length > 0 
      ? contributions.reduce((sum: number, c: any) => sum + Number(c.amount), 0) / contributions.length 
      : 0;
    const memberGrowth = ((activeCount / members.length) * 100).toFixed(1);

    // Monthly data for chart
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(2026, i);
      const monthContribs = contributions.filter(c => {
        const cDate = new Date(c.contribution_date);
        return cDate.getMonth() === i && cDate.getFullYear() === 2026;
      });
      return {
        month: month.toLocaleString('default', { month: 'short' }),
        amount: monthContribs.reduce((sum: number, c: any) => sum + Number(c.amount), 0),
        count: monthContribs.length
      };
    });

    // Status distribution
    const statusData = [
      { name: 'Active', value: members.filter(m => m.member_status === 'active').length },
      { name: 'Inactive', value: members.filter(m => m.member_status === 'inactive').length },
      { name: 'Suspended', value: members.filter(m => m.member_status === 'suspended').length }
    ];

    return { activeCount, contributionRate, avgContribution, memberGrowth, monthlyData, statusData };
  }, [members, contributions, totalSavings]);

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  return (
    <div className="space-y-6 pb-6">
      <h3 className="text-xl font-bold text-gray-900 px-4">Analytics Dashboard</h3>

      {/* KPI Cards */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-600 font-medium">Active Members</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{metrics.activeCount}</p>
          <p className="text-xs text-blue-600 mt-1">{metrics.memberGrowth}% of total</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-600 font-medium">Contribution Rate</p>
          </div>
          <p className="text-2xl font-bold text-green-900">{metrics.contributionRate.toFixed(1)}%</p>
          <p className="text-xs text-green-600 mt-1">This month</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-purple-600 font-medium">Avg Contribution</p>
          </div>
          <p className="text-2xl font-bold text-purple-900">KES {metrics.avgContribution.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-600" />
            <p className="text-xs text-amber-600 font-medium">Total Savings</p>
          </div>
          <p className="text-2xl font-bold text-amber-900">KES {totalSavings.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="px-4 space-y-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Monthly Contributions Trend</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={metrics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Member Status Distribution */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 flex justify-center">
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-center">Member Status</h4>
            <ResponsiveContainer width={300} height={200}>
              <PieChart>
                <Pie
                  data={metrics.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-4">
              {metrics.statusData.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-gray-700">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
