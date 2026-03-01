import { useState } from 'react';
import { Clock } from 'lucide-react';

interface WithdrawalRequestsProps {
  adminId: string;
  onRefresh?: () => void;
}

// Withdrawal requests table doesn't exist yet - showing placeholder
export default function WithdrawalRequests({ adminId, onRefresh }: WithdrawalRequestsProps) {
  return (
    <div className="px-4 pb-6">
      <h3 className="text-lg font-semibold text-gray-600 mb-4">Withdrawal Requests</h3>
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="text-lg font-bold text-gray-900 mb-2">Coming Soon</h4>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Withdrawal requests feature will be available once the savings cycle ends.
        </p>
      </div>
    </div>
  );
}
