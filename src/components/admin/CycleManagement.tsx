import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarRange, Plus, History, CheckCircle2, Clock, AlertCircle, X, Users, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, differenceInDays, isAfter, startOfDay } from 'date-fns';

interface Cycle {
  id: string;
  cycle_name: string;
  start_date: string;
  end_date: string;
  status: string;
  total_savings: number;
  notes: string | null;
  created_at: string;
}

interface MemberCycleData {
  user_id: string;
  full_name: string;
  total: number;
  count: number;
}

interface CycleManagementProps {
  adminId: string;
}

export default function CycleManagement({ adminId }: CycleManagementProps) {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [cycleMembers, setCycleMembers] = useState<Record<string, MemberCycleData[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [cycleName, setCycleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      const { data, error } = await supabase
        .from('savings_cycles')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      if (data) setCycles(data as Cycle[]);
    } catch (error) {
      console.error('Error fetching cycles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check and auto-end expired cycles
  useEffect(() => {
    const checkExpiredCycles = async () => {
      const today = startOfDay(new Date());
      const activeCycles = cycles.filter(c => c.status === 'active');
      
      for (const cycle of activeCycles) {
        const end = parseISO(cycle.end_date);
        if (isAfter(today, end)) {
          await endCycleWithCalculation(cycle);
        }
      }
    };

    if (cycles.length > 0) {
      checkExpiredCycles();
    }
  }, [cycles.length]);

  const endCycleWithCalculation = async (cycle: Cycle) => {
    try {
      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount')
        .gte('contribution_date', cycle.start_date)
        .lte('contribution_date', cycle.end_date);

      const totalSavings = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      // Reveal all balances
      await supabase
        .from('profiles')
        .update({ balance_visible: true })
        .neq('user_id', '');

      // Mark cycle as ended
      await supabase
        .from('savings_cycles')
        .update({ status: 'ended', total_savings: totalSavings })
        .eq('id', cycle.id);

      toast({
        title: 'Cycle Ended',
        description: `"${cycle.cycle_name}" ended. Total: KES ${totalSavings.toLocaleString()}. Balances revealed.`,
      });

      fetchCycles();
    } catch (error) {
      console.error('Error ending cycle:', error);
    }
  };

  const fetchCycleMembers = async (cycle: Cycle) => {
    if (cycleMembers[cycle.id]) {
      setExpandedCycleId(expandedCycleId === cycle.id ? null : cycle.id);
      return;
    }

    try {
      const { data: contributions } = await supabase
        .from('contributions')
        .select('user_id, amount')
        .gte('contribution_date', cycle.start_date)
        .lte('contribution_date', cycle.end_date);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      if (contributions && profiles) {
        const memberMap: Record<string, MemberCycleData> = {};
        
        for (const c of contributions) {
          if (!memberMap[c.user_id]) {
            const profile = profiles.find(p => p.user_id === c.user_id);
            memberMap[c.user_id] = {
              user_id: c.user_id,
              full_name: profile?.full_name || 'Unknown',
              total: 0,
              count: 0,
            };
          }
          memberMap[c.user_id].total += Number(c.amount);
          memberMap[c.user_id].count += 1;
        }

        const sorted = Object.values(memberMap).sort((a, b) => b.total - a.total);
        setCycleMembers(prev => ({ ...prev, [cycle.id]: sorted }));
      }

      setExpandedCycleId(cycle.id);
    } catch (error) {
      console.error('Error fetching cycle members:', error);
    }
  };

  const downloadCycleReport = (cycle: Cycle) => {
    const members = cycleMembers[cycle.id] || [];
    let csv = 'Member,Contributions,Total (KES)\n';
    members.forEach(m => {
      csv += `"${m.full_name}",${m.count},${m.total}\n`;
    });
    csv += `\n"TOTAL",,${cycle.total_savings}\n`;
    csv += `\nCycle: ${cycle.cycle_name}\n`;
    csv += `Period: ${cycle.start_date} to ${cycle.end_date}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cycle.cycle_name.replace(/\s+/g, '_')}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Downloaded', description: 'Cycle report saved as CSV.' });
  };

  const activeCycle = cycles.find(c => c.status === 'active');
  const endedCycles = cycles.filter(c => c.status === 'ended');

  const handleCreateCycle = async () => {
    if (!cycleName || !startDate || !endDate) {
      toast({ title: 'Missing fields', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = differenceInDays(end, start);

    if (days < 1) {
      toast({ title: 'Invalid dates', description: 'End date must be after start date.', variant: 'destructive' });
      return;
    }

    if (days > 366) {
      toast({ title: 'Too long', description: 'Cycle cannot exceed one year.', variant: 'destructive' });
      return;
    }

    if (activeCycle) {
      toast({ title: 'Active cycle exists', description: 'End the current cycle before creating a new one.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Reset all balances for the new cycle
      await supabase
        .from('profiles')
        .update({ balance_visible: false, balance_adjustment: 0 })
        .neq('user_id', '');

      const { error } = await supabase
        .from('savings_cycles')
        .insert({
          cycle_name: cycleName,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          created_by: adminId,
        });

      if (error) throw error;

      toast({ title: 'Cycle created', description: `"${cycleName}" is now active.` });
      setShowCreate(false);
      setCycleName('');
      setStartDate('');
      setEndDate('');
      fetchCycles();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create cycle';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEndCycle = async (cycle: Cycle) => {
    await endCycleWithCalculation(cycle);
  };

  const getDaysRemaining = (endDateStr: string) => {
    const end = parseISO(endDateStr);
    const today = startOfDay(new Date());
    return Math.max(0, differenceInDays(end, today));
  };

  const getCycleProgress = (startDateStr: string, endDateStr: string) => {
    const start = parseISO(startDateStr);
    const end = parseISO(endDateStr);
    const today = startOfDay(new Date());
    const total = differenceInDays(end, start);
    const elapsed = differenceInDays(today, start);
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getCycleDuration = (startDateStr: string, endDateStr: string) => {
    return differenceInDays(parseISO(endDateStr), parseISO(startDateStr));
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading cycles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <CalendarRange className="w-5 h-5" />
          Savings Cycles
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1 ${
              showHistory ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
          {!activeCycle && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-gray-900 rounded-full text-sm font-medium text-white hover:bg-gray-800 transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          )}
        </div>
      </div>

      {/* Active Cycle Card */}
      {activeCycle ? (
        <div className="bg-gray-100 rounded-3xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Active</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900">{activeCycle.cycle_name}</h4>
            </div>
            <button
              onClick={() => handleEndCycle(activeCycle)}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-full text-sm font-medium hover:bg-red-200 transition"
            >
              End Cycle
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-3">
              <p className="text-xs text-gray-500 font-medium">Start</p>
              <p className="font-bold text-gray-900 text-sm">{format(parseISO(activeCycle.start_date), 'MMM d, yyyy')}</p>
            </div>
            <div className="bg-white rounded-2xl p-3">
              <p className="text-xs text-gray-500 font-medium">End</p>
              <p className="font-bold text-gray-900 text-sm">{format(parseISO(activeCycle.end_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{Math.round(getCycleProgress(activeCycle.start_date, activeCycle.end_date))}% complete</span>
              <span>{getDaysRemaining(activeCycle.end_date)} days left</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                style={{ width: `${getCycleProgress(activeCycle.start_date, activeCycle.end_date)}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 rounded-3xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h4 className="font-bold text-gray-900 mb-1">No Active Cycle</h4>
          <p className="text-sm text-gray-500 mb-4">Members cannot make deposits until a cycle is started.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-3 bg-gray-900 rounded-full text-sm font-medium text-white hover:bg-gray-800 transition"
          >
            Create New Cycle
          </button>
        </div>
      )}

      {/* Cycle History */}
      {showHistory && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Cycle History</h4>
          {endedCycles.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">No completed cycles yet.</p>
          ) : (
            endedCycles.map(cycle => (
              <div key={cycle.id} className="bg-gray-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => fetchCycleMembers(cycle)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-gray-200/50 transition"
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">{cycle.cycle_name}</p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(cycle.start_date), 'MMM d')} — {format(parseISO(cycle.end_date), 'MMM d, yyyy')} · {getCycleDuration(cycle.start_date, cycle.end_date)} days
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="font-bold text-gray-900">KES {cycle.total_savings.toLocaleString()}</p>
                      <span className="text-xs text-gray-500">Total</span>
                    </div>
                    {expandedCycleId === cycle.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded member breakdown */}
                {expandedCycleId === cycle.id && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="flex items-center justify-between py-3">
                      <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Member Breakdown
                      </span>
                      {cycleMembers[cycle.id]?.length > 0 && (
                        <button
                          onClick={() => downloadCycleReport(cycle)}
                          className="text-xs font-medium text-gray-600 flex items-center gap-1 hover:text-gray-900 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          CSV
                        </button>
                      )}
                    </div>

                    {cycleMembers[cycle.id]?.length ? (
                      <div className="space-y-2">
                        {cycleMembers[cycle.id].map((member, i) => (
                          <div key={member.user_id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                              {member.full_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm">{member.full_name}</p>
                              <p className="text-xs text-gray-500">{member.count} contributions</p>
                            </div>
                            <p className="font-bold text-gray-900 text-sm">KES {member.total.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-3">No contributions in this cycle.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Cycle Dialog */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-gray-900">New Savings Cycle</h3>
              <button onClick={() => setShowCreate(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Cycle Name</label>
                <input
                  type="text"
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                  placeholder="e.g. April 2026"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Max: 1 year. Balances auto-reveal at end.</p>
              </div>

              <button
                onClick={handleCreateCycle}
                disabled={saving}
                className="w-full py-4 bg-gray-900 rounded-full text-white font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Start Cycle'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
