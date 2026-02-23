import { useEffect, useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { getRandomTip } from '@/lib/financial-tips';

interface FinancialTip {
  category: 'streak' | 'money' | 'growth';
  content: string;
  icon: string;
}

interface FinancialTipsWindowProps {
  showClose?: boolean;
  onClose?: () => void;
  showInitially?: boolean;
}

export default function FinancialTipsWindow({ showClose = true, onClose, showInitially = true }: FinancialTipsWindowProps) {
  const [isVisible, setIsVisible] = useState(showInitially);
  const [tip, setTip] = useState<FinancialTip | null>(null);

  const randomTip = useMemo(() => getRandomTip(), []);

  useEffect(() => {
    setTip(randomTip);
  }, [randomTip]);

  if (!isVisible || !tip) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div className="px-4 pb-6">
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-6 relative overflow-hidden border border-blue-100">
        {/* Decorative background circles */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full opacity-30 blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {showClose && (
            <button 
              className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition active:scale-95 shadow-sm"
              onClick={handleClose}
              title="Dismiss"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
          
          {/* Tip Icon and Content */}
          <div className="flex items-start gap-4">
            <div className="text-4xl mt-1 flex-shrink-0">{tip.icon}</div>
            <div className="flex-1 pr-8">
              <p className="text-lg font-semibold text-gray-900 leading-relaxed">
                {tip.content}
              </p>
              <div className="mt-3 flex gap-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  tip.category === 'streak' 
                    ? 'bg-red-100 text-red-700'
                    : tip.category === 'money'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {tip.category === 'streak' ? '🔥 Streak' : tip.category === 'money' ? '💰 Money' : '📈 Growth'}
                </span>
              </div>
            </div>
          </div>

          {/* Motivational Footer */}
          <div className="mt-4 pt-4 border-t border-purple-200/50">
            <p className="text-sm text-gray-600 italic">
              "Every contribution brings you closer to your financial dreams. Keep going! 🌟"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
