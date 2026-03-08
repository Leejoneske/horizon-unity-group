import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, Pencil, Check, Lock, Eye, EyeOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { User } from '@supabase/supabase-js';

interface AccountDetailsProps {
  profile: {
    full_name: string;
    phone_number: string | null;
    balance_visible: boolean;
    daily_contribution_amount: number;
  };
  user: User;
  effectiveBalance: number;
  contributions: { length: number };
  missedDays: number;
  dailyAmount: number;
  activeCycle: {
    cycle_name: string;
    start_date: string;
    end_date: string;
  } | null;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export default function AccountDetailsPanel({
  profile,
  user,
  effectiveBalance,
  contributions,
  missedDays,
  dailyAmount,
  activeCycle,
  onClose,
  onProfileUpdated,
}: AccountDetailsProps) {
  const { toast } = useToast();

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

  const [nameValue, setNameValue] = useState(profile.full_name);
  const [emailValue, setEmailValue] = useState(user.email || '');
  const [phoneValue, setPhoneValue] = useState(
    profile.phone_number ? profile.phone_number.replace(/^254/, '0') : ''
  );
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed.length > 100) {
      toast({ title: 'Invalid name', description: 'Name must be 1-100 characters.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('user_id', user.id);
      if (error) throw error;

      // Also update auth metadata
      await supabase.auth.updateUser({ data: { full_name: trimmed } });

      toast({ title: '✅ Name updated' });
      setEditingName(false);
      onProfileUpdated();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to update name', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    const trimmed = emailValue.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.length > 255) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      toast({ title: '📧 Confirmation sent', description: 'Check your new email to confirm the change.' });
      setEditingEmail(false);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to update email', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePhone = async () => {
    if (!passwordValue) {
      toast({ title: 'Password required', description: 'Enter your password to change your phone number.', variant: 'destructive' });
      return;
    }

    const trimmed = phoneValue.trim();
    if (!trimmed || !/^0[17]\d{8}$/.test(trimmed)) {
      toast({ title: 'Invalid phone', description: 'Enter a valid Kenyan phone number (e.g. 0712345678).', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Verify password by re-signing in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordValue,
      });
      if (authError) {
        toast({ title: 'Wrong password', description: 'The password you entered is incorrect.', variant: 'destructive' });
        setSaving(false);
        return;
      }

      // Convert to 254 format
      const formattedPhone = '254' + trimmed.slice(1);

      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: formattedPhone })
        .eq('user_id', user.id);
      if (error) throw error;

      toast({ title: '✅ Phone number updated' });
      setEditingPhone(false);
      setPasswordValue('');
      setShowPassword(false);
      onProfileUpdated();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to update phone', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl text-gray-900">Account Details</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Avatar & Name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
            {profile.full_name?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  maxLength={100}
                  className="flex-1 min-w-0 text-base font-bold text-gray-900 bg-gray-100 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-pink-400"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition shrink-0 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameValue(profile.full_name); }}
                  className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-gray-900 truncate">{profile.full_name || 'Member'}</p>
                <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-gray-600 transition shrink-0">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}

            {editingEmail ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  maxLength={255}
                  className="flex-1 min-w-0 text-sm text-gray-600 bg-gray-100 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-pink-400"
                  autoFocus
                />
                <button
                  onClick={handleSaveEmail}
                  disabled={saving}
                  className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition shrink-0 disabled:opacity-50"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { setEditingEmail(false); setEmailValue(user.email || ''); }}
                  className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                <button onClick={() => setEditingEmail(true)} className="text-gray-400 hover:text-gray-600 transition shrink-0">
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Editable Phone Number */}
          <div className="bg-gray-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 font-semibold">PHONE NUMBER</p>
              {!editingPhone && (
                <button onClick={() => setEditingPhone(true)} className="text-gray-400 hover:text-gray-600 transition">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {editingPhone ? (
              <div className="space-y-2">
                <input
                  type="tel"
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={10}
                  placeholder="0712345678"
                  className="w-full text-base font-bold text-gray-900 bg-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-pink-400"
                  autoFocus
                />
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder="Enter password to confirm"
                    className="w-full text-sm text-gray-900 bg-white rounded-xl pl-9 pr-9 py-2 outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePhone}
                    disabled={saving}
                    className="flex-1 py-2 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {saving ? 'Verifying...' : 'Update Phone'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingPhone(false);
                      setPhoneValue(profile.phone_number ? profile.phone_number.replace(/^254/, '0') : '');
                      setPasswordValue('');
                      setShowPassword(false);
                    }}
                    className="py-2 px-4 bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-base font-bold text-gray-900">
                {profile.phone_number ? profile.phone_number.replace(/^254/, '0') : 'Not set'}
              </p>
            )}
          </div>

          <div className="bg-gray-100 rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">DAILY TARGET</p>
            <p className="text-base font-bold text-gray-900">KES {dailyAmount.toLocaleString()}</p>
          </div>

          {profile.balance_visible && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
              <p className="text-xs text-green-700 font-semibold mb-1">TOTAL SAVINGS (THIS CYCLE)</p>
              <p className="text-2xl font-bold text-green-600">KES {effectiveBalance.toLocaleString()}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 font-semibold mb-1">CONTRIBUTIONS</p>
              <p className="text-xl font-bold text-gray-900">{contributions.length}</p>
              <p className="text-xs text-gray-500">days paid</p>
            </div>
            <div className="bg-gray-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 font-semibold mb-1">MISSED DAYS</p>
              <p className="text-xl font-bold text-gray-900">{missedDays}</p>
              <p className="text-xs text-gray-500">this cycle</p>
            </div>
          </div>

          {activeCycle && (
            <div className="bg-gray-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 font-semibold mb-1">ACTIVE CYCLE</p>
              <p className="text-base font-bold text-gray-900">{activeCycle.cycle_name}</p>
              <p className="text-sm text-gray-500">
                {format(parseISO(activeCycle.start_date), 'MMM d')} — {format(parseISO(activeCycle.end_date), 'MMM d, yyyy')}
              </p>
            </div>
          )}

          <div className="bg-gray-100 rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">MEMBER SINCE</p>
            <p className="text-base font-bold text-gray-900">
              {user.created_at ? format(parseISO(user.created_at), 'MMMM d, yyyy') : '—'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-4 bg-gray-100 rounded-full font-semibold text-gray-900 hover:bg-gray-200 transition active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}
