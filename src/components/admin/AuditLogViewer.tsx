import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Filter, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

interface AuditLogViewerProps {
  logs: AuditLog[];
}

export default function AuditLogViewer({ logs }: AuditLogViewerProps) {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = logs.filter(log => {
    const matchesAction = filterAction === 'all' || log.action.includes(filterAction);
    const matchesType = filterType === 'all' || log.entity_type === filterType;
    return matchesAction && matchesType;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-700';
    if (action.includes('update')) return 'bg-blue-100 text-blue-700';
    if (action.includes('delete')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 px-4">Audit Logs</h3>

      {/* Filters */}
      <div className="px-4 flex gap-2">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="all">All Types</option>
          <option value="member">Member</option>
          <option value="contribution">Contribution</option>
          <option value="balance">Balance</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
      </div>

      {/* Logs */}
      <div className="px-4 pb-6 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No logs found</p>
          </div>
        ) : (
          filtered.map(log => (
            <div key={log.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <LogOut className="w-4 h-4 text-gray-500" />
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-gray-500">{log.entity_type}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {format(parseISO(log.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
