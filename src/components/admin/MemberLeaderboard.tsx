import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Flame, TrendingUp } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  total_contributions: number;
  contribution_count: number;
  this_month: number;
  streak_days: number;
}

interface MemberLeaderboardProps {
  adminId: string;
}

export default function MemberLeaderboard({ adminId }: MemberLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'top_savers' | 'most_consistent' | 'this_month'>('top_savers');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [adminId]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', adminId);

      const { data: contributionsData } = await supabase
        .from('contributions')
        .select('*')
        .order('contribution_date', { ascending: false });

      if (profilesData && contributionsData) {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const monthStartStr = format(monthStart, 'yyyy-MM-dd');
        const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

        const entries = profilesData.map((profile: any) => {
          const memberContribs = contributionsData.filter((c: any) => c.user_id === profile.user_id);
          const thisMonthContribs = memberContribs.filter((c: any) => 
            c.contribution_date >= monthStartStr && c.contribution_date <= monthEndStr
          );
          const totalSaved = memberContribs.reduce((sum, c: any) => sum + Number(c.amount), 0);

          // Calculate streak
          let streak = 0;
          if (memberContribs.length > 0) {
            const sortedDates = memberContribs.map((c: any) => parseISO(c.contribution_date)).sort((a, b) => b.getTime() - a.getTime());
            const today = new Date();
            let currentDate = today;
            for (const date of sortedDates) {
              const daysDiff = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
              if (daysDiff <= 1) {
                streak++;
                currentDate = date;
              } else {
                break;
              }
            }
          }

          return {
            user_id: profile.user_id,
            full_name: profile.full_name,
            total_contributions: totalSaved,
            contribution_count: memberContribs.length,
            this_month: thisMonthContribs.reduce((sum, c: any) => sum + Number(c.amount), 0),
            streak_days: streak
          };
        });

        let sorted = [...entries];
        if (activeTab === 'top_savers') {
          sorted.sort((a, b) => b.total_contributions - a.total_contributions);
        } else if (activeTab === 'most_consistent') {
          sorted.sort((a, b) => b.contribution_count - a.contribution_count);
        } else {
          sorted.sort((a, b) => b.this_month - a.this_month);
        }

        setLeaderboard(sorted.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 pb-6">
        <div className="text-center py-8 text-gray-400">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <h3 className="text-lg font-semibold text-gray-600 mb-4">Member Leaderboard</h3>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('top_savers')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
            activeTab === 'top_savers'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Top Savers
        </button>
        <button
          onClick={() => setActiveTab('most_consistent')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
            activeTab === 'most_consistent'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Most Consistent
        </button>
        <button
          onClick={() => setActiveTab('this_month')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
            activeTab === 'this_month'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Flame className="w-4 h-4 inline mr-2" />
          This Month
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No data yet</div>
        ) : (
          leaderboard.map((entry, idx) => (
            <div key={entry.user_id} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-100 transition">
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white'
                : idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
                : idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                : 'bg-gray-200 text-gray-700'
              }`}>
                {idx + 1}
              </div>

              {/* Name and Stats */}
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{entry.full_name}</p>
                <p className="text-xs text-gray-500">
                  {activeTab === 'top_savers' && `Total: KES ${entry.total_contributions.toLocaleString()}`}
                  {activeTab === 'most_consistent' && `${entry.contribution_count} contributions`}
                  {activeTab === 'this_month' && `This month: KES ${entry.this_month.toLocaleString()}`}
                </p>
              </div>

              {/* Badge */}
              {entry.streak_days > 0 && (
                <div className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {entry.streak_days}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
