import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Pencil,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone as PhoneIcon,
  Mail,
  Shield,
  Calendar,
  Wallet,
  Target,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Profile {
  full_name: string;
  phone_number: string | null;
  balance_visible: boolean;
  daily_contribution_amount: number;
  balance_adjustment: number;
  missed_contributions: number;
}

interface ActiveCycle {
  id: string;
  cycle_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function UserSettings() {
  const { user, signOut, isAdmin, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeCycle, setActiveCycle] = useState<ActiveCycle | null>(null);
  const [contributionCount, setContributionCount] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
    else if (!authLoading && isAdmin) navigate('/admin/dashboard', { replace: true });
    else if (user) fetchData();
  }, [user, isAdmin, authLoading]);

  const fetchData = async () => {
    try {
      const [profileRes, cycleRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user!.id).single(),
        supabase.from('savings_cycles').select('*').eq('status', 'active').limit(1).single(),
      ]);

      const p = profileRes.data;
      if (p) {
        setProfile(p);
        setNameValue(p.full_name);
        setEmailValue(user!.email || '');
        setPhoneValue(p.phone_number ? p.phone_number.replace(/^254/, '0') : '');
      }

      const cycle = cycleRes.data as ActiveCycle | null;
      setActiveCycle(cycle);

      // Fetch contributions
      let q = supabase.from('contributions').select('amount').eq('user_id', user!.id);
      if (cycle) {
        q = q.gte('contribution_date', cycle.start_date).lte('contribution_date', cycle.end_date);
      }
      const { data: contribs } = await q;
      if (contribs) {
        setContributionCount(contribs.length);
        setTotalSaved(contribs.reduce((sum, c) => sum + Number(c.amount), 0));
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed.length > 100) {
      toast({ title: 'Invalid name', description: 'Name must be 1-100 characters.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: trimmed }).eq('user_id', user!.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: trimmed } });
      toast({ title: 'Name updated' });
      setEditingName(false);
      fetchData();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    const trimmed = emailValue.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: 'Invalid email', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      toast({ title: 'Confirmation sent', description: 'Check your new email to confirm.' });
      setEditingEmail(false);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePhone = async () => {
    if (!passwordValue) {
      toast({ title: 'Password required', variant: 'destructive' });
      return;
    }
    const trimmed = phoneValue.trim();
    if (!trimmed || !/^0[17]\d{8}$/.test(trimmed)) {
      toast({ title: 'Invalid phone', description: 'Enter a valid Kenyan number (e.g. 0712345678).', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: user!.email!, password: passwordValue });
      if (authError) { toast({ title: 'Wrong password', variant: 'destructive' }); setSaving(false); return; }
      const formattedPhone = '254' + trimmed.slice(1);
      const { error } = await supabase.from('profiles').update({ phone_number: formattedPhone }).eq('user_id', user!.id);
      if (error) throw error;
      toast({ title: 'Phone number updated' });
      setEditingPhone(false);
      setPasswordValue('');
      setShowPassword(false);
      fetchData();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password changed', description: 'Your password has been updated successfully.' });
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="w-screen h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile || !user) return null;

  return (
    <div className="w-screen h-screen bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate('/dashboard')} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Profile Section */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shrink-0">
              {profile.full_name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-foreground truncate">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="px-4 pb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Personal Information</h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            {/* Name */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Full Name</span>
                </div>
                {!editingName && (
                  <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
              {editingName ? (
                <div className="flex items-center gap-2 mt-2">
                  <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} maxLength={100} className="flex-1" autoFocus />
                  <button onClick={handleSaveName} disabled={saving} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 disabled:opacity-50">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingName(false); setNameValue(profile.full_name); }} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-base font-semibold text-foreground">{profile.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Email</span>
                </div>
                {!editingEmail && (
                  <button onClick={() => setEditingEmail(true)} className="text-muted-foreground hover:text-foreground transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
              {editingEmail ? (
                <div className="flex items-center gap-2 mt-2">
                  <Input type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} className="flex-1" autoFocus />
                  <button onClick={handleSaveEmail} disabled={saving} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 disabled:opacity-50">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingEmail(false); setEmailValue(user.email || ''); }} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-base font-semibold text-foreground">{user.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PhoneIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Phone Number</span>
                </div>
                {!editingPhone && (
                  <button onClick={() => setEditingPhone(true)} className="text-muted-foreground hover:text-foreground transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
              {editingPhone ? (
                <div className="space-y-2 mt-2">
                  <Input type="tel" value={phoneValue} onChange={(e) => setPhoneValue(e.target.value.replace(/[^0-9]/g, ''))} maxLength={10} placeholder="0712345678" autoFocus />
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      placeholder="Enter password to confirm"
                      className="pl-9 pr-9"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSavePhone} disabled={saving} className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50">
                      {saving ? 'Verifying...' : 'Update Phone'}
                    </button>
                    <button onClick={() => { setEditingPhone(false); setPhoneValue(profile.phone_number ? profile.phone_number.replace(/^254/, '0') : ''); setPasswordValue(''); setShowPassword(false); }} className="py-2 px-4 bg-secondary text-muted-foreground text-sm font-semibold rounded-xl hover:bg-muted transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-base font-semibold text-foreground">
                  {profile.phone_number ? profile.phone_number.replace(/^254/, '0') : 'Not set'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="px-4 pb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Security</h2>
          <div className="bg-card rounded-2xl border border-border">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-base font-semibold text-foreground">Change Password</span>
                </div>
                <button onClick={() => setShowChangePassword(!showChangePassword)} className="text-sm font-medium text-primary hover:underline">
                  {showChangePassword ? 'Cancel' : 'Change'}
                </button>
              </div>
              {showChangePassword && (
                <div className="mt-4 space-y-3">
                  <div>
                    <Label className="text-sm">New Password</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Confirm New Password</Label>
                    <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Re-enter new password" className="mt-1" />
                  </div>
                  <button onClick={handleChangePassword} disabled={saving} className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50">
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Savings Summary */}
        <div className="px-4 pb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Savings Summary</h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="w-4 h-4" />
                <span className="text-sm">Daily Target</span>
              </div>
              <span className="font-bold text-foreground">KES {profile.daily_contribution_amount.toLocaleString()}</span>
            </div>

            {profile.balance_visible && (
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm">Total Saved (This Cycle)</span>
                </div>
                <span className="font-bold text-primary">KES {totalSaved.toLocaleString()}</span>
              </div>
            )}

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-4 h-4" />
                <span className="text-sm">Contributions Made</span>
              </div>
              <span className="font-bold text-foreground">{contributionCount} days</span>
            </div>

            {activeCycle && (
              <div className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Active Cycle</span>
                </div>
                <p className="font-semibold text-foreground">{activeCycle.cycle_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(activeCycle.start_date), 'MMM d')} — {format(parseISO(activeCycle.end_date), 'MMM d, yyyy')}
                </p>
              </div>
            )}

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Member Since</span>
              </div>
              <span className="font-semibold text-foreground">
                {user.created_at ? format(parseISO(user.created_at), 'MMM d, yyyy') : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="px-4 pb-6">
          <button
            onClick={handleSignOut}
            className="w-full py-3 bg-destructive/10 text-destructive rounded-2xl font-semibold hover:bg-destructive/20 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
