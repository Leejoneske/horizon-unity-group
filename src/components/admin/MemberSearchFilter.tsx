import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  member_status: string;
  member_role: string;
  total_contributions: number;
  contribution_count: number;
}

interface MemberSearchFilterProps {
  members: Member[];
  onMemberSelect: (member: Member) => void;
}

export default function MemberSearchFilter({ members, onMemberSelect }: MemberSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filtered = members.filter(m => {
    const matchesSearch = m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.phone_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || m.member_status === statusFilter;
    const matchesRole = roleFilter === 'all' || m.member_role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 px-4">Find Members</h3>

      {/* Search and Filters */}
      <div className="px-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {/* Filter Row */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="all">All Roles</option>
            <option value="member">Member</option>
            <option value="coordinator">Coordinator</option>
            <option value="leader">Leader</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 pb-6">
        <p className="text-sm text-gray-500 mb-3">{filtered.length} members found</p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No members found</p>
            </div>
          ) : (
            filtered.map(member => (
              <button
                key={member.id}
                onClick={() => onMemberSelect(member)}
                className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3 text-left transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{member.full_name}</p>
                    <p className="text-xs text-gray-500">{member.phone_number || 'No phone'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeColor(member.member_status)}`}>
                      {member.member_status}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
