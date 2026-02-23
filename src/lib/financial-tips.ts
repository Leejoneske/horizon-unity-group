// Financial tips, quotes, and streak growth advice
export const FINANCIAL_TIPS = [
  {
    category: 'streak',
    content: '🔥 Tip: Building a savings streak is like building muscle - consistent small efforts compound into big results!',
    icon: '🎯'
  },
  {
    category: 'streak',
    content: '💪 Did you know? People with 30+ day savings streaks are 5x more likely to reach their goals.',
    icon: '📈'
  },
  {
    category: 'streak',
    content: '⭐ Challenge yourself: Try to maintain your savings streak for 100 days. That\'s a full transformation!',
    icon: '🏆'
  },
  {
    category: 'money',
    content: '"A penny saved is a penny earned." - Benjamin Franklin. Start small, think big.',
    icon: '💰'
  },
  {
    category: 'money',
    content: '"The best time to plant a tree was 20 years ago. The second best time is now." - Chinese Proverb',
    icon: '🌱'
  },
  {
    category: 'money',
    content: '"Money is not the goal. Freedom is the goal." - Tony Robbins. Save with purpose.',
    icon: '🕊️'
  },
  {
    category: 'money',
    content: '"If you do not find a way to make money while you sleep, you will work until you die." - Warren Buffett',
    icon: '💡'
  },
  {
    category: 'growth',
    content: '📊 Pro tip: Track your progress weekly. Seeing your savings grow is incredibly motivating!',
    icon: '📱'
  },
  {
    category: 'growth',
    content: '🎓 Learning: Understand your spending patterns. You can\'t improve what you don\'t measure.',
    icon: '🔍'
  },
  {
    category: 'growth',
    content: '🌟 Wisdom: Your future self will thank you for every contribution you make today.',
    icon: '🎁'
  },
  {
    category: 'growth',
    content: '💎 Quality over quantity: Consistent small savings beats sporadic large deposits.',
    icon: '✨'
  },
  {
    category: 'money',
    content: '"Compound interest is the eighth wonder of the world. He who understands it, earns it." - Einstein',
    icon: '🧮'
  },
  {
    category: 'streak',
    content: '🎉 Milestone: Every day you contribute, you\'re building a stronger financial future!',
    icon: '🚀'
  },
  {
    category: 'growth',
    content: '🏅 Remember: Small consistent actions lead to incredible results over time.',
    icon: '⚡'
  },
  {
    category: 'money',
    content: '"The richest people focus on hourly rates, not hourly wages." Think about adding value.',
    icon: '💼'
  },
  {
    category: 'growth',
    content: '🎯 Goal-setting: Break your savings goal into monthly targets. It makes it achievable.',
    icon: '🗓️'
  },
  {
    category: 'streak',
    content: '🔐 Security: Each day you save is one day closer to financial independence.',
    icon: '🛡️'
  },
  {
    category: 'money',
    content: '"You must gain control over your money or the lack of it will forever control you." - Dave Ramsey',
    icon: '👑'
  },
  {
    category: 'growth',
    content: '🌅 New day, new opportunity: Every morning is a chance to make a positive financial decision.',
    icon: '⏰'
  },
  {
    category: 'streak',
    content: '💪 Discipline today = Freedom tomorrow. Keep building that streak!',
    icon: '🎖️'
  },
  {
    category: 'money',
    content: '"An investment in knowledge pays the best interest." Keep learning about finances!',
    icon: '📚'
  },
  {
    category: 'growth',
    content: '🎨 Be creative: Find unique ways to save. Every shilling counts toward your dreams.',
    icon: '✏️'
  },
  {
    category: 'money',
    content: '"The stock market is a device for transferring money from the impatient to the patient." - Warren Buffett',
    icon: '📊'
  },
  {
    category: 'streak',
    content: '🌟 Consistency wins: Superior returns come from consistent, disciplined saving.',
    icon: '✅'
  },
  {
    category: 'growth',
    content: '🎁 Reward yourself: Celebrate small wins along the way. You\'re doing great!',
    icon: '🎊'
  }
];

/**
 * Get a random financial tip or quote
 */
export const getRandomTip = () => {
  const randomIndex = Math.floor(Math.random() * FINANCIAL_TIPS.length);
  return FINANCIAL_TIPS[randomIndex];
};

/**
 * Get tips filtered by category
 */
export const getTipsByCategory = (category: 'streak' | 'money' | 'growth') => {
  return FINANCIAL_TIPS.filter(tip => tip.category === category);
};

/**
 * Get a specific number of random tips
 */
export const getRandomTips = (count: number = 3) => {
  const shuffled = [...FINANCIAL_TIPS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, FINANCIAL_TIPS.length));
};

/**
 * Get a tip based on time of day for personalization
 */
export const getTipForTimeOfDay = () => {
  const hour = new Date().getHours();
  let categoryPreference: 'streak' | 'money' | 'growth';
  
  if (hour < 12) {
    // Morning: motivational streak tips
    categoryPreference = 'streak';
  } else if (hour < 17) {
    // Afternoon: practical growth tips
    categoryPreference = 'growth';
  } else {
    // Evening: inspirational money quotes
    categoryPreference = 'money';
  }
  
  const categoryTips = getTipsByCategory(categoryPreference);
  return categoryTips[Math.floor(Math.random() * categoryTips.length)];
};
