import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Activity, Plus, Minus, Edit3, UserPlus, Eye, Settings, Send, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('entity_type', filter);
      }

      const { data } = await query;
      setLogs(data || []);
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const getActionIcon = (action: string) => {
    if (action.includes('add') || action.includes('credit')) return <Plus className="w-4 h-4 text-green-600" />;
    if (action.includes('deduct') || action.includes('debit')) return <Minus className="w-4 h-4 text-red-600" />;
    if (action.includes('update') || action.includes('change')) return <Edit3 className="w-4 h-4 text-blue-600" />;
    if (action.includes('visibility')) return <Eye className="w-4 h-4 text-purple-600" />;
    if (action.includes('announce') || action.includes('message')) return <Send className="w-4 h-4 text-indigo-600" />;
    if (action.includes('cycle')) return <Settings className="w-4 h-4 text-orange-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('add') || action.includes('credit')) return 'bg-green-100 text-green-700';
    if (action.includes('deduct') || action.includes('debit')) return 'bg-red-100 text-red-700';
    if (action.includes('update') || action.includes('change')) return 'bg-blue-100 text-blue-700';
    if (action.includes('visibility')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4 px-4 pb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-600">Activity Log</h3>
        <button
          onClick={fetchLogs}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'balance', 'contribution', 'visibility', 'announcement', 'cycle'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              filter === f
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400 animate-pulse">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No activity yet</p>
          <p className="text-gray-400 text-sm mt-1">Admin actions will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-gray-400">{log.entity_type}</span>
                  </div>
                  {log.details && (
                    <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {format(parseISO(log.created_at), 'MMM d, yyyy · h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
