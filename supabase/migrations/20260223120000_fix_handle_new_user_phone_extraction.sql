-- Fix handle_new_user function to correctly extract phone_number from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone_number)
    VALUES (
            NEW.id, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'),
            COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
    );
      
    -- Check if this is the designated admin email
    IF NEW.email = 'johnwanderi202@gmail.com' THEN
      INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin');
    ELSE
      -- Add default member role for everyone else
      INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'member');
    END IF;
                                    
    RETURN NEW;
END;
$function$;
