import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Minus, 
  Settings,
  Users
} from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  total_contributions: number;
  contribution_count: number;
  balance_visible: boolean;
  daily_contribution_amount: number;
  balance_adjustment: number;
  missed_contributions: number;
}

interface MemberManagementProps {
  members: Member[];
  onRefresh: () => void;
  adminId: string;
}

export default function MemberManagement({ members, onRefresh, adminId }: MemberManagementProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [newDailyAmount, setNewDailyAmount] = useState('');
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isContribDialogOpen, setIsContribDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleToggleVisibility = async (member: Member) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance_visible: !member.balance_visible })
        .eq('user_id', member.user_id);

      if (error) throw error;

      toast({
        title: 'Visibility updated',
        description: `Balance is now ${!member.balance_visible ? 'visible' : 'hidden'} for ${member.full_name}`,
      });
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update visibility';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleAllVisibility = async (visible: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance_visible: visible })
        .neq('user_id', adminId);

      if (error) throw error;

      toast({
        title: 'All balances updated',
        description: `All member balances are now ${visible ? 'visible' : 'hidden'}`,
      });
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update visibility';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!selectedMember || !adjustmentAmount) return;
    
    setIsLoading(true);
    try {
      const amount = parseFloat(adjustmentAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Record the adjustment
      const { error: adjustError } = await supabase
        .from('balance_adjustments')
        .insert({
          user_id: selectedMember.user_id,
          admin_id: adminId,
          amount: adjustmentType === 'add' ? amount : -amount,
          adjustment_type: adjustmentType,
          reason: adjustmentReason || null,
        });

      if (adjustError) throw adjustError;

      // Update profile balance_adjustment
      const currentAdjustment = selectedMember.balance_adjustment || 0;
      const newAdjustment = adjustmentType === 'add' 
        ? currentAdjustment + amount 
        : currentAdjustment - amount;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance_adjustment: newAdjustment })
        .eq('user_id', selectedMember.user_id);

      if (profileError) throw profileError;

      toast({
        title: 'Balance adjusted',
        description: `${adjustmentType === 'add' ? 'Added' : 'Deducted'} KES ${amount.toLocaleString()} ${adjustmentType === 'add' ? 'to' : 'from'} ${selectedMember.full_name}'s balance`,
      });
      
      setIsAdjustDialogOpen(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setSelectedMember(null);
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to adjust balance';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContributionAmountChange = async () => {
    if (!selectedMember || !newDailyAmount) return;
    
    setIsLoading(true);
    try {
      const amount = parseFloat(newDailyAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ daily_contribution_amount: amount })
        .eq('user_id', selectedMember.user_id);

      if (error) throw error;

      toast({
        title: 'Contribution amount updated',
        description: `${selectedMember.full_name}'s daily contribution is now KES ${amount.toLocaleString()}`,
      });
      
      setIsContribDialogOpen(false);
      setNewDailyAmount('');
      setSelectedMember(null);
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update contribution amount';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openAdjustDialog = (member: Member, type: 'add' | 'deduct') => {
    setSelectedMember(member);
    setAdjustmentType(type);
    setIsAdjustDialogOpen(true);
  };

  const openContribDialog = (member: Member) => {
    setSelectedMember(member);
    setNewDailyAmount(member.daily_contribution_amount.toString());
    setIsContribDialogOpen(true);
  };

  return (
    <div className="finance-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Member Management
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleToggleAllVisibility(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Show All
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleToggleAllVisibility(false)}>
            <EyeOff className="w-4 h-4 mr-2" />
            Hide All
          </Button>
        </div>
      </div>
      
      {members.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No members yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Member</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Phone</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Daily Target</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Total Saved</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Visible</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const effectiveBalance = member.total_contributions + (member.balance_adjustment || 0);
                return (
                  <tr key={member.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {member.full_name?.charAt(0) || 'M'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium block">{member.full_name}</span>
                          {member.missed_contributions > 0 && (
                            <span className="text-xs text-destructive">
                              {member.missed_contributions} missed days
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground text-sm">
                      {member.phone_number || '-'}
                    </td>
                    <td className="py-3 px-2 text-right text-sm">
                      KES {member.daily_contribution_amount?.toLocaleString() || '100'}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold amount-positive">
                      KES {effectiveBalance.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleVisibility(member)}
                        title={member.balance_visible ? 'Hide balance' : 'Show balance'}
                      >
                        {member.balance_visible ? (
                          <Eye className="w-4 h-4 text-primary" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openAdjustDialog(member, 'add')}
                          title="Add to balance"
                        >
                          <Plus className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openAdjustDialog(member, 'deduct')}
                          title="Deduct from balance"
                        >
                          <Minus className="w-4 h-4 text-destructive" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openContribDialog(member)}
                          title="Adjust contribution amount"
                        >
                          <Settings className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Balance Adjustment Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === 'add' ? 'Add to' : 'Deduct from'} Balance
            </DialogTitle>
            <DialogDescription>
              {adjustmentType === 'add' ? 'Add funds to' : 'Deduct funds from'} {selectedMember?.full_name}'s account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="adjustAmount">Amount (KES)</Label>
              <Input
                id="adjustAmount"
                type="number"
                placeholder="Enter amount"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustReason">Reason (optional)</Label>
              <Input
                id="adjustReason"
                placeholder="Enter reason for adjustment"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleBalanceAdjustment} 
              disabled={isLoading || !adjustmentAmount} 
              className="w-full"
            >
              {isLoading ? 'Processing...' : `${adjustmentType === 'add' ? 'Add' : 'Deduct'} Amount`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contribution Amount Dialog */}
      <Dialog open={isContribDialogOpen} onOpenChange={setIsContribDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Daily Contribution</DialogTitle>
            <DialogDescription>
              Set the daily contribution target for {selectedMember?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="dailyAmount">Daily Amount (KES)</Label>
              <Input
                id="dailyAmount"
                type="number"
                placeholder="Enter daily amount"
                value={newDailyAmount}
                onChange={(e) => setNewDailyAmount(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleContributionAmountChange} 
              disabled={isLoading || !newDailyAmount} 
              className="w-full"
            >
              {isLoading ? 'Updating...' : 'Update Daily Amount'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
