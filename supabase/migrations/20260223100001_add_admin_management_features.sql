-- Create enum for member status
CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'suspended');

-- Create enum for member roles
CREATE TYPE public.member_role AS ENUM ('member', 'coordinator', 'leader');

-- Create enum for withdrawal status
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member_notes table
CREATE TABLE IF NOT EXISTS public.member_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create penalties table
CREATE TABLE IF NOT EXISTS public.member_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS public.member_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  awarded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcement_templates table
CREATE TABLE IF NOT EXISTS public.announcement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'announcement',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_to_all BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id, setting_key)
);

-- Add new fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS member_status member_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS member_role member_role DEFAULT 'member',
ADD COLUMN IF NOT EXISTS penalty_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS document_verified BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_member_notes_user ON public.member_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_member_penalties_user ON public.member_penalties(user_id);
CREATE INDEX IF NOT EXISTS idx_member_rewards_user ON public.member_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(member_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(member_role);

-- Update RLS policies for new tables
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests"
ON public.withdrawal_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests"
ON public.withdrawal_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage withdrawal requests"
ON public.withdrawal_requests FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for member_notes
CREATE POLICY "Admins can manage member notes"
ON public.member_notes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for member_penalties & rewards
CREATE POLICY "Admins can manage penalties"
ON public.member_penalties FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage rewards"
ON public.member_rewards FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for announcements
CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view announcements"
ON public.announcements FOR SELECT
USING (TRUE);

-- RLS policies for admin_settings
CREATE POLICY "Admins can manage their settings"
ON public.admin_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));
