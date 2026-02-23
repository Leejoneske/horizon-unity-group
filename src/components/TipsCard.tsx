import { useEffect, useState, useMemo } from 'react';
import { X, TrendingUp, Lightbulb, Target } from 'lucide-react';
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

  const getIconColor = () => {
    switch(tip.category) {
      case 'streak': return 'from-red-300 to-red-400';
      case 'money': return 'from-green-300 to-green-400';
      case 'growth': return 'from-blue-300 to-blue-400';
      default: return 'from-green-300 to-green-400';
    }
  };

  const getIconElement = () => {
    switch(tip.category) {
      case 'streak': return <Target className="w-8 h-8 text-white" />;
      case 'money': return <TrendingUp className="w-8 h-8 text-white" />;
      case 'growth': return <Lightbulb className="w-8 h-8 text-white" />;
      default: return <TrendingUp className="w-8 h-8 text-white" />;
    }
  };

  return (
    <div className="px-4 pb-6">
      <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-3xl p-6 relative overflow-hidden">
        {showClose && (
          <button 
            className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition active:scale-95 shadow-sm"
            onClick={handleClose}
            title="Dismiss tip"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
        
        {/* Decorative Boxes */}
        <div className="flex gap-2 mb-6">
          <div className={`w-12 h-12 bg-gradient-to-br ${getIconColor()} rounded-2xl flex items-center justify-center shadow-md transform -rotate-6`}>
            {getIconElement()}
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-300 to-emerald-400 rounded-2xl flex items-center justify-center shadow-md transform rotate-6">
            <span className="text-lg font-bold text-white">💡</span>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-teal-300 to-teal-400 rounded-2xl flex items-center justify-center shadow-md transform -rotate-3">
            <span className="text-lg font-bold text-white">✨</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">Financial Wisdom</h3>
          <p className="text-lg font-semibold text-gray-900 leading-relaxed">
            {tip.content}
          </p>
          
          {/* Category Badge */}
          <div className="flex items-center gap-2 pt-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 ${
              tip.category === 'streak' 
                ? 'bg-red-200/60 text-red-700'
                : tip.category === 'money'
                ? 'bg-green-200/60 text-green-700'
                : 'bg-blue-200/60 text-blue-700'
            }`}>
              {tip.category === 'streak' ? '🔥 Streak Tip' : tip.category === 'money' ? '💰 Money Tip' : '📈 Growth Tip'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
