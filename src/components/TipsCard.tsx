import { useEffect, useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { getRandomTip } from '@/lib/financial-tips';

interface FinancialTip {
  category: 'streak' | 'money' | 'growth';
  content: string;
  icon: string;
}

interface TipsCardProps {
  showClose?: boolean;
  onClose?: () => void;
  showInitially?: boolean;
}

export default function TipsCard({ showClose = true, onClose, showInitially = true }: TipsCardProps) {
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
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 relative overflow-hidden border border-gray-200">
        {showClose && (
          <button 
            className="absolute top-4 right-4 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition active:scale-95 shadow-sm"
            onClick={handleClose}
            title="Dismiss"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
        
        {/* Content */}
        <div className="flex gap-4">
          <div className="text-3xl mt-1 flex-shrink-0">{tip.icon}</div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-gray-800 leading-relaxed">
              {tip.content}
            </p>
            <div className="mt-3">
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
      </div>
    </div>
  );
}
