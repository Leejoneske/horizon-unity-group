import { useState } from 'react';
import { X, Phone, CheckCircle, AlertCircle, Loader, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhoneContributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userPhone: string; // Pre-registered phone number
  defaultAmount?: number;
}

type PaymentStatus = 'idle' | 'loading' | 'success' | 'error';

export default function PhoneContributionDialog({
  isOpen,
  onClose,
  userId,
  userName,
  userPhone,
  defaultAmount = 100
}: PhoneContributionDialogProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const formatPhoneForDisplay = (phone: string): string => {
    // Convert to format like: 0701234567 or +254701234567
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) {
      return '0' + cleaned.substring(3);
    }
    return phone;
  };

  const handleInitiatePayment = async () => {
    if (!userPhone) {
      setErrorMessage('Phone number not registered. Please update your profile.');
      setPaymentStatus('error');
      return;
    }

    setPaymentStatus('loading');
    setErrorMessage('');

    try {
      // Get Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/initiate-pesapal-payment`;

      // Call the Edge Function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount: defaultAmount,
          phoneNumber: userPhone,
          userName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to initiate payment');
      }

      setPaymentStatus('success');
      toast({
        title: '✅ Payment Initiated',
        description: `STK prompt sent to ${formatPhoneForDisplay(userPhone)}. Check your phone and enter your M-Pesa PIN.`
      });

      // Auto-close after 3 seconds on success
      setTimeout(() => {
        onClose();
        setPaymentStatus('idle');
      }, 3000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process payment';
      setErrorMessage(message);
      setPaymentStatus('error');
      toast({
        title: '❌ Payment Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  if (!isOpen) return null;

  const displayPhone = formatPhoneForDisplay(userPhone);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-6 flex items-center justify-between border-b border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Quick Contribution</h3>
              <p className="text-xs text-gray-600">via M-Pesa</p>
            </div>
          </div>
          {paymentStatus === 'idle' && (
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow-sm"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-6">
          {/* Status States */}
          {paymentStatus === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xl text-gray-900">Payment Sent!</h4>
                <p className="text-gray-600 text-sm mt-2">
                  Check your phone for the M-Pesa prompt on <span className="font-semibold">{displayPhone}</span>
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-sm text-green-900">✓ Enter your 4-digit M-Pesa PIN to complete</p>
              </div>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-orange-500 mx-auto flex items-center justify-center shadow-lg">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xl text-gray-900">Payment Failed</h4>
                <p className="text-gray-600 text-sm mt-2">{errorMessage}</p>
              </div>
              <button
                onClick={() => setPaymentStatus('idle')}
                className="w-full py-3 px-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}

          {paymentStatus === 'loading' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 mx-auto flex items-center justify-center shadow-lg">
                <Loader className="w-8 h-8 text-white animate-spin" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-gray-900">Initiating Payment...</h4>
                <p className="text-gray-600 text-sm mt-2">Sending STK prompt to {displayPhone}</p>
              </div>
            </div>
          )}

          {paymentStatus === 'idle' && (
            <div className="space-y-5">
              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-sm text-blue-900 font-medium">
                  💡 One-click contribution. You'll get an M-Pesa prompt instantly.
                </p>
              </div>

              {/* Phone Display */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Phone Number</p>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{displayPhone}</p>
                    <p className="text-xs text-gray-600">Your registered number</p>
                  </div>
                </div>
              </div>

              {/* Amount Display */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</p>
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4">
                  <p className="text-4xl font-bold text-emerald-600">KES {defaultAmount.toLocaleString()}</p>
                  <p className="text-xs text-gray-600 mt-1">Your daily contribution</p>
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Make sure you have at least <span className="font-semibold">KES {defaultAmount}</span> on your M-Pesa account.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {paymentStatus === 'idle' && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200 flex gap-3 shadow-sm">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-900 hover:bg-gray-50 hover:border-gray-400 transition active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleInitiatePayment}
              disabled={paymentStatus === 'loading'}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-white hover:from-green-600 hover:to-emerald-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              <Send className="w-4 h-4" />
              Send Payment Prompt
            </button>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-white hover:from-green-600 hover:to-emerald-700 transition active:scale-95"
            >
              Done
            </button>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200 flex gap-3 shadow-sm">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-900 hover:bg-gray-50 hover:border-gray-400 transition active:scale-95"
            >
              Close
            </button>
            <button
              onClick={() => setPaymentStatus('idle')}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-white hover:from-green-600 hover:to-emerald-700 transition active:scale-95 shadow-lg"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
