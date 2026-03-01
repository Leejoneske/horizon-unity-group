import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  total_contributions: number;
  contribution_count: number;
}

interface MemberSearchFilterProps {
  members: Member[];
  onMemberSelect: (member: Member) => void;
}

export default function MemberSearchFilter({ members, onMemberSelect }: MemberSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = members.filter(m => {
    return m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           m.phone_number?.includes(searchTerm);
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 px-4">Find Members</h3>

      <div className="px-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </div>

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
                  <span className="text-sm font-bold text-green-600">
                    KES {member.total_contributions.toLocaleString()}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
