
-- Drop the existing ALL policy and recreate with explicit WITH CHECK
DROP POLICY IF EXISTS "Admins can manage messages" ON public.admin_messages;

CREATE POLICY "Admins can manage messages"
ON public.admin_messages
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
