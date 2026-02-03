import { format, parseISO } from 'date-fns';
import { CheckCircle2, Clock, EyeOff } from 'lucide-react';

interface Contribution {
  id: string;
  amount: number;
  contribution_date: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    balance_visible: boolean;
  } | null;
}

interface RecentContributionsProps {
  contributions: Contribution[];
}

export default function RecentContributions({ contributions }: RecentContributionsProps) {
  return (
    <div className="finance-card">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Recent Contributions
      </h3>
      
      {contributions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No contributions yet.</p>
      ) : (
        <div className="space-y-3">
          {contributions.slice(0, 15).map((contribution) => (
            <div key={contribution.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  contribution.status === 'completed' ? 'bg-primary/10' : 'bg-warning/10'
                }`}>
                  {contribution.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Clock className="w-4 h-4 text-warning" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {contribution.profiles?.full_name || 'Unknown Member'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(contribution.contribution_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              {contribution.profiles?.balance_visible ? (
                <span className="font-semibold amount-positive">
                  +KES {Number(contribution.amount).toLocaleString()}
                </span>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <EyeOff className="w-4 h-4" />
                  <span className="text-sm">Hidden</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
