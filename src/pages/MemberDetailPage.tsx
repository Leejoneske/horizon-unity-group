import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit-log';
import { createAdminMessage } from '@/lib/admin-notifications';
import { sendAdminContributionSMS } from '@/lib/sms-reminders';
import { Calendar, Clock, Key, Plus, Trash2, ChevronLeft, Phone, Pencil, Check, X, Eye, EyeOff, Target, UserX, MessageSquare, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

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

interface Contribution {
  id: string;
  user_id: string;
  amount: number;
  contribution_date: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function MemberDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [member, setMember] = useState<Member | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [contributionAmount, setContributionAmount] = useState('100');
  const [isAddingContrib, setIsAddingContrib] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Edit states
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetValue, setTargetValue] = useState('');
  const [editingMissed, setEditingMissed] = useState(false);
  const [missedValue, setMissedValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Quick message
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [quickMessage, setQuickMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    if (userId) fetchMemberDetails();
  }, [userId, isAdmin, navigate]);

  const fetchMemberDetails = async () => {
    try {
      setIsLoading(true);
      const [profileRes, cycleRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('savings_cycles').select('*').eq('status', 'active').single()
      ]);

      const profileData = profileRes.data;
      const activeCycleData = cycleRes.data;

      if (profileData) {
        let contribQuery = supabase.from('contributions').select('*').eq('user_id', userId).order('contribution_date', { ascending: false });
        if (activeCycleData) {
          contribQuery = contribQuery.gte('contribution_date', activeCycleData.start_date).lte('contribution_date', activeCycleData.end_date);
        }
        const { data: contribData } = await contribQuery;
        const totalContribs = contribData ? contribData.reduce((sum, c) => sum + Number(c.amount), 0) : 0;

        let missedDays = 0;
        if (activeCycleData) {
          const today = new Date();
          const cycleStart = new Date(activeCycleData.start_date);
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          const endDay = yesterday < cycleStart ? cycleStart : yesterday;
          const totalDays = Math.max(0, Math.floor((endDay.getTime() - cycleStart.getTime()) / (24 * 60 * 60 * 1000)) + 1);
          const contributedDays = contribData?.length || 0;
          missedDays = Math.max(0, totalDays - contributedDays);
        }

        const m: Member = {
          id: profileData.id,
          user_id: profileData.user_id,
          full_name: profileData.full_name,
          phone_number: profileData.phone_number,
          total_contributions: totalContribs,
          contribution_count: contribData?.length || 0,
          balance_visible: profileData.balance_visible,
          daily_contribution_amount: profileData.daily_contribution_amount,
          balance_adjustment: profileData.balance_adjustment || 0,
          missed_contributions: missedDays
        };
        setMember(m);
        setPhoneValue(profileData.phone_number ? profileData.phone_number.replace(/^254/, '0') : '');
        setNameValue(profileData.full_name);
        setTargetValue(profileData.daily_contribution_amount.toString());
        setMissedValue(String(missedDays));

        if (contribData) setContributions(contribData);
        if (profileData.daily_contribution_amount) setContributionAmount(profileData.daily_contribution_amount.toString());
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      toast({ title: 'Error', description: 'Failed to load member details', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePhone = async () => {
    if (!member || !user) return;
    const trimmed = phoneValue.trim();
    if (!trimmed || !/^0[17]\d{8}$/.test(trimmed)) {
      toast({ title: 'Invalid phone', description: 'Enter a valid Kenyan number (e.g. 0712345678).', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const formattedPhone = '254' + trimmed.slice(1);
      const { error } = await supabase.from('profiles').update({ phone_number: formattedPhone }).eq('user_id', member.user_id);
      if (error) throw error;
      await logAdminAction(user.id, 'edit_phone', 'profile', member.user_id, `Changed phone to ${trimmed} for ${member.full_name}`);
      toast({ title: 'Phone number updated' });
      setEditingPhone(false);
      fetchMemberDetails();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveName = async () => {
    if (!member || !user) return;
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed.length > 100) {
      toast({ title: 'Invalid name', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: trimmed }).eq('user_id', member.user_id);
      if (error) throw error;
      await logAdminAction(user.id, 'edit_name', 'profile', member.user_id, `Changed name to ${trimmed}`);
      toast({ title: 'Name updated' });
      setEditingName(false);
      fetchMemberDetails();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTarget = async () => {
    if (!member || !user) return;
    const amount = parseFloat(targetValue);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ daily_contribution_amount: amount }).eq('user_id', member.user_id);
      if (error) throw error;
      await logAdminAction(user.id, 'change_contribution_target', 'contribution', member.user_id, `Changed daily target to KES ${amount.toLocaleString()} for ${member.full_name}`);
      toast({ title: 'Daily target updated' });
      setEditingTarget(false);
      fetchMemberDetails();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMissed = async () => {
    if (!member || !user) return;
    const val = parseInt(missedValue);
    if (isNaN(val) || val < 0) {
      toast({ title: 'Invalid number', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ missed_contributions: val }).eq('user_id', member.user_id);
      if (error) throw error;
      await logAdminAction(user.id, 'edit_missed', 'profile', member.user_id, `Set missed contributions to ${val} for ${member.full_name}`);
      toast({ title: 'Missed contributions updated' });
      setEditingMissed(false);
      fetchMemberDetails();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!member || !user) return;
    try {
      const { error } = await supabase.from('profiles').update({ balance_visible: !member.balance_visible }).eq('user_id', member.user_id);
      if (error) throw error;
      await logAdminAction(user.id, 'toggle_visibility', 'visibility', member.user_id, `Set balance ${!member.balance_visible ? 'visible' : 'hidden'} for ${member.full_name}`);
      toast({ title: `Balance ${!member.balance_visible ? 'visible' : 'hidden'}` });
      fetchMemberDetails();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleSendQuickMessage = async () => {
    if (!member || !user || !quickMessage.trim()) return;
    setSendingMessage(true);
    try {
      await createAdminMessage({ userId: member.user_id, adminId: user.id, message: quickMessage.trim() });
      await logAdminAction(user.id, 'send_message', 'message', member.user_id, `Sent message to ${member.full_name}`);
      toast({ title: 'Message sent' });
      setQuickMessage('');
      setShowMessageBox(false);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddContributionForDate = async () => {
    if (!selectedDate || !member || !user) {
      toast({ title: 'Error', description: 'Please select a date', variant: 'destructive' });
      return;
    }
    try {
      setIsAddingContrib(true);
      const existingContrib = contributions.find(c => c.contribution_date === selectedDate);
      if (existingContrib) {
        toast({ title: 'Error', description: 'Contribution already exists for this date', variant: 'destructive' });
        return;
      }
      const amount = Number(contributionAmount) || member.daily_contribution_amount;
      const formattedDate = format(new Date(selectedDate), 'MMM d, yyyy');
      const { error } = await supabase.from('contributions').insert({ user_id: member.user_id, amount, contribution_date: selectedDate, status: 'completed', notes: 'Added by Horizon Unit' });
      if (error) throw error;
      const notificationResult = await createAdminMessage({ userId: member.user_id, adminId: user.id, message: `A contribution of KES ${amount.toLocaleString()} has been recorded on your behalf for ${formattedDate}.` });
      const smsSent = member.phone_number ? await sendAdminContributionSMS(member.phone_number, member.full_name, amount, formattedDate) : false;
      await logAdminAction(user.id, 'admin_add_contribution', 'contribution', member.user_id, `Added KES ${amount.toLocaleString()} contribution for ${member.full_name} on ${formattedDate}`);
      toast({
        title: notificationResult.success && (!member.phone_number || smsSent) ? 'Success' : 'Partially completed',
        description: `Contribution of KES ${amount.toLocaleString()} added for ${formattedDate}.`
      });
      setSelectedDate('');
      fetchMemberDetails();
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to add contribution', variant: 'destructive' });
    } finally {
      setIsAddingContrib(false);
    }
  };

  const handleRemoveContribution = async (contribId: string) => {
    try {
      const { error } = await supabase.from('contributions').delete().eq('id', contribId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Contribution removed' });
      fetchMemberDetails();
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6 || !member) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    try {
      setIsResettingPassword(true);
      const { error } = await supabase.auth.admin.updateUserById(member.user_id, { password: newPassword });
      if (error) throw error;
      await logAdminAction(user!.id, 'reset_password', 'security', member.user_id, `Reset password for ${member.full_name}`);
      toast({ title: 'Success', description: `Password reset for ${member.full_name}` });
      setNewPassword('');
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to reset password', variant: 'destructive' });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading member details...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="w-screen h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Member not found</h2>
          <button onClick={() => navigate('/admin/dashboard')} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const effectiveBalance = member.total_contributions;
  const lastContribution = contributions.length > 0 ? contributions[0] : null;
  const lastLoginText = lastContribution ? format(parseISO(lastContribution.contribution_date), 'MMM d, yyyy') : 'No activity yet';

  return (
    <div className="w-screen h-screen bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            {member.full_name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">{member.full_name}</h1>
            <p className="text-xs text-muted-foreground">{member.phone_number ? member.phone_number.replace(/^254/, '0') : 'No phone'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8" style={{ scrollBehavior: 'smooth' }}>
        {/* Stats */}
        <div className="px-4 pt-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Balance</p>
              <p className="text-xl font-bold text-foreground">KES {effectiveBalance.toLocaleString()}</p>
            </div>
            <div className="bg-secondary rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Contributions</p>
              <p className="text-xl font-bold text-foreground">{member.contribution_count}</p>
            </div>
            <div className="bg-secondary rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Missed</p>
              <p className="text-xl font-bold text-foreground">{member.missed_contributions}</p>
            </div>
          </div>
        </div>

        {/* Member Profile Management */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Member Profile</h3>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            {/* Name */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Full Name</span>
                {!editingName && (
                  <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                )}
              </div>
              {editingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} maxLength={100} className="flex-1" autoFocus />
                  <button onClick={handleSaveName} disabled={saving} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 disabled:opacity-50"><Check className="w-4 h-4" /></button>
                  <button onClick={() => { setEditingName(false); setNameValue(member.full_name); }} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="text-base font-semibold text-foreground">{member.full_name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</span>
                </div>
                {!editingPhone && (
                  <button onClick={() => setEditingPhone(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                )}
              </div>
              {editingPhone ? (
                <div className="space-y-2 mt-1">
                  <Input type="tel" value={phoneValue} onChange={(e) => setPhoneValue(e.target.value.replace(/[^0-9]/g, ''))} maxLength={10} placeholder="0712345678" autoFocus />
                  <div className="flex gap-2">
                    <button onClick={handleSavePhone} disabled={saving} className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50">
                      {saving ? 'Saving...' : 'Update Phone'}
                    </button>
                    <button onClick={() => { setEditingPhone(false); setPhoneValue(member.phone_number ? member.phone_number.replace(/^254/, '0') : ''); }} className="py-2 px-4 bg-secondary text-muted-foreground text-sm font-semibold rounded-xl hover:bg-muted transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-base font-semibold text-foreground">
                  {member.phone_number ? member.phone_number.replace(/^254/, '0') : 'Not set'}
                </p>
              )}
            </div>

            {/* Daily Target */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Daily Target</span>
                </div>
                {!editingTarget && (
                  <button onClick={() => setEditingTarget(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                )}
              </div>
              {editingTarget ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="flex-1" autoFocus />
                  <button onClick={handleSaveTarget} disabled={saving} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 disabled:opacity-50"><Check className="w-4 h-4" /></button>
                  <button onClick={() => { setEditingTarget(false); setTargetValue(member.daily_contribution_amount.toString()); }} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="text-base font-semibold text-foreground">KES {member.daily_contribution_amount.toLocaleString()}</p>
              )}
            </div>

            {/* Missed Contributions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Missed Days</span>
                </div>
                {!editingMissed && (
                  <button onClick={() => setEditingMissed(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                )}
              </div>
              {editingMissed ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input type="number" value={missedValue} onChange={(e) => setMissedValue(e.target.value)} className="flex-1" autoFocus />
                  <button onClick={handleSaveMissed} disabled={saving} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 disabled:opacity-50"><Check className="w-4 h-4" /></button>
                  <button onClick={() => { setEditingMissed(false); setMissedValue(String(member.missed_contributions)); }} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="text-base font-semibold text-foreground">{member.missed_contributions} days</p>
              )}
            </div>

            {/* Balance Visibility Toggle */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {member.balance_visible ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Balance Visibility</span>
                </div>
                <button onClick={handleToggleVisibility} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${member.balance_visible ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  {member.balance_visible ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </div>

            {/* Last Activity */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase">Last Contribution</span>
              </div>
              <p className="text-base font-semibold text-foreground">{lastLoginText}</p>
            </div>
          </div>
        </div>

        {/* Quick Message */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Message</h3>
          <div className="bg-card rounded-2xl border border-border p-4">
            {showMessageBox ? (
              <div className="space-y-3">
                <textarea
                  value={quickMessage}
                  onChange={(e) => setQuickMessage(e.target.value)}
                  placeholder="Type a message to this member..."
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={500}
                />
                <div className="flex gap-2">
                  <button onClick={handleSendQuickMessage} disabled={sendingMessage || !quickMessage.trim()} className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50">
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                  <button onClick={() => { setShowMessageBox(false); setQuickMessage(''); }} className="py-2.5 px-4 bg-secondary text-muted-foreground text-sm font-semibold rounded-xl hover:bg-muted transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowMessageBox(true)} className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-foreground text-sm font-semibold rounded-xl hover:bg-muted transition">
                <MessageSquare className="w-4 h-4" />
                Send Message to {member.full_name.split(' ')[0]}
              </button>
            )}
          </div>
        </div>

        {/* Add Contribution */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add Contribution</h3>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="contrib-date" className="text-sm font-semibold text-muted-foreground">Date</Label>
              <Input id="contrib-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contrib-amount" className="text-sm font-semibold text-muted-foreground">Amount (KES)</Label>
              <Input id="contrib-amount" type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} />
            </div>
            <button onClick={handleAddContributionForDate} disabled={isAddingContrib || !selectedDate} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              {isAddingContrib ? 'Adding...' : 'Add Contribution'}
            </button>
          </div>
        </div>

        {/* Recent Contributions */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Contributions</h3>
          <div className="bg-card rounded-2xl border border-border">
            {contributions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm"><p>No contributions recorded yet</p></div>
            ) : (
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {contributions.slice(0, 15).map((contrib) => (
                  <div key={contrib.id} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition">
                    <div className="flex items-center gap-3 flex-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">{format(parseISO(contrib.contribution_date), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">KES {contrib.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveContribution(contrib.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 transition" title="Remove contribution">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Security</h3>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-semibold text-muted-foreground">Reset Password</Label>
              <p className="text-xs text-muted-foreground">Create a new password for this member (min. 6 characters)</p>
              <Input id="new-password" type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <button onClick={handleResetPassword} disabled={isResettingPassword || !newPassword || newPassword.length < 6} className="w-full py-3 bg-destructive text-destructive-foreground rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2">
              <Key className="w-4 h-4" />
              {isResettingPassword ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
