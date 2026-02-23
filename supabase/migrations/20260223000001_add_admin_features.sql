-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reason TEXT,
  rejection_reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Member notes table
CREATE TABLE IF NOT EXISTS public.member_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Member achievements/badges
CREATE TABLE IF NOT EXISTS public.member_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('100days', '50days', '30days', 'perfect_month', 'top_saver', 'consistent_contributor', 'milestone')),
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Penalties and bonuses
CREATE TABLE IF NOT EXISTS public.member_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('penalty', 'bonus')),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin settings/configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_name TEXT,
  group_description TEXT,
  min_contribution DECIMAL(10,2) DEFAULT 100,
  max_contribution DECIMAL(10,2) DEFAULT 10000,
  contribution_frequency TEXT DEFAULT 'daily' CHECK (contribution_frequency IN ('daily', 'weekly', 'monthly')),
  enable_sms_reminders BOOLEAN DEFAULT true,
  reminder_time TEXT DEFAULT '09:00',
  enable_email_reminders BOOLEAN DEFAULT true,
  withdrawal_approval_required BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id)
);

-- Communication templates
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('sms', 'email', 'in_app')),
  content TEXT NOT NULL,
  variables TEXT, -- JSON array of variables like {{name}}, {{amount}}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Member status and roles
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'verified')),
ADD COLUMN IF NOT EXISTS member_role TEXT DEFAULT 'member' CHECK (member_role IN ('member', 'coordinator', 'group_leader')),
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_member_notes_user_id ON public.member_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_member_achievements_user_id ON public.member_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_member_rewards_user_id ON public.member_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_member_role ON public.profiles(member_role);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests" 
ON public.withdrawal_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests" 
ON public.withdrawal_requests FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all withdrawal requests" 
ON public.withdrawal_requests FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own withdrawal requests" 
ON public.withdrawal_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for member_notes
CREATE POLICY "Admins can view member notes" 
ON public.member_notes FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage member notes" 
ON public.member_notes FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for achievements
CREATE POLICY "Users can view their own achievements" 
ON public.member_achievements FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all achievements" 
ON public.member_achievements FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage achievements" 
ON public.member_achievements FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rewards
CREATE POLICY "Users can view their own rewards" 
ON public.member_rewards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all rewards" 
ON public.member_rewards FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage rewards" 
ON public.member_rewards FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_settings
CREATE POLICY "Admins can view their settings" 
ON public.admin_settings FOR SELECT 
USING (auth.uid() = admin_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update their settings" 
ON public.admin_settings FOR UPDATE 
USING (auth.uid() = admin_id);

CREATE POLICY "Admins can insert settings" 
ON public.admin_settings FOR INSERT 
WITH CHECK (auth.uid() = admin_id);

-- RLS Policies for message_templates
CREATE POLICY "Admins can view message templates" 
ON public.message_templates FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage message templates" 
ON public.message_templates FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));
