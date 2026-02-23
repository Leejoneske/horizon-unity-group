import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, CheckCircle2, XCircle, Clock, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason: string | null;
  rejection_reason: string | null;
  requested_at: string;
  processed_at: string | null;
  profiles?: { full_name: string; phone_number?: string } | null;
}

interface WithdrawalRequestsProps {
  adminId: string;
  onRefresh?: () => void;
}

export default function WithdrawalRequests({ adminId, onRefresh }: WithdrawalRequestsProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithdrawals();
  }, [activeTab]);

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('withdrawal_requests')
        .select('*, profiles:user_id(full_name, phone_number)')
        .order('requested_at', { ascending: false });

      if (activeTab === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data } = await query;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch withdrawal requests',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'approved',
          admin_id: adminId,
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Withdrawal request approved'
      });

      fetchWithdrawals();
      onRefresh?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (withdrawalId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a rejection reason',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          admin_id: adminId,
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Withdrawal request rejected'
      });

      setSelectedWithdrawal(null);
      setRejectionReason('');
      fetchWithdrawals();
      onRefresh?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 pb-6">
        <div className="text-center py-8 text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <h3 className="text-lg font-semibold text-gray-600 mb-4">Withdrawal Requests</h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            activeTab === 'pending'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Pending ({withdrawals.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            activeTab === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Requests
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {withdrawals.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {activeTab === 'pending' ? 'No pending requests' : 'No requests'}
          </div>
        ) : (
          withdrawals.map((withdrawal) => (
            <div key={withdrawal.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{withdrawal.profiles?.full_name}</p>
                  <p className="text-sm text-gray-500">{withdrawal.profiles?.phone_number}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  withdrawal.status === 'pending' ? 'bg-orange-100 text-orange-700'
                  : withdrawal.status === 'approved' ? 'bg-green-100 text-green-700'
                  : withdrawal.status === 'rejected' ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
                }`}>
                  {withdrawal.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-lg font-bold text-green-600">
                  <DollarSign className="w-5 h-5" />
                  KES {withdrawal.amount.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">
                  {format(parseISO(withdrawal.requested_at), 'MMM d, HH:mm')}
                </p>
              </div>

              {withdrawal.reason && (
                <p className="text-sm text-gray-600 mb-2">Reason: {withdrawal.reason}</p>
              )}

              {withdrawal.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleApprove(withdrawal.id)}
                    disabled={isProcessing}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg font-semibold text-white hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setSelectedWithdrawal(withdrawal)}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-red-500 to-red-600 rounded-lg font-semibold text-white hover:from-red-600 hover:to-red-700 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-gray-900">Reject Request</h3>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {selectedWithdrawal.profiles?.full_name} - KES {selectedWithdrawal.amount.toLocaleString()}
            </p>
            <textarea
              placeholder="Reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="flex-1 py-3 px-4 bg-gray-100 rounded-xl font-semibold text-gray-900 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedWithdrawal.id)}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 rounded-xl font-semibold text-white hover:from-red-600 hover:to-red-700 transition disabled:opacity-50"
              >
                {isProcessing ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
