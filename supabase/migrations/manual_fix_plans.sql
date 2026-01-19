-- Force Insert Starter Plan if missing
INSERT INTO public.plans (name, price, commission_rate, features)
VALUES (
    'starter', 
    0, 
    15.00,
    '{"description": "Gezgin Paket - Risksiz Başlangıç"}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Force Ensure Columns exist in Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_goal TEXT;

-- Verify if plans exist
SELECT * FROM public.plans;
