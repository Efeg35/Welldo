-- =======================================================
-- FINAL GOLDEN MASTER SQL (ONBOARDING & PLANS)
-- =======================================================

-- 1. TEMİZLİK: Eski otomatik tetikleyicileri kaldır
-- (Burası çok kritik, yoksa çakışma olur)
DROP TRIGGER IF EXISTS on_user_created_community ON auth.users;
DROP FUNCTION IF EXISTS public.create_community_for_new_user;

-- 2. PROFİL TABLOSU GÜNCELLEMESİ
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS primary_goal TEXT;

-- 3. PLANLAR TABLOSU (SAĞLAMLAŞTIRILMIŞ)
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    price DECIMAL(10,2) DEFAULT 0,
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- YAMA: Eğer tablo önceden varsa ve 'price' sütunu yoksa ekle
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='price') THEN
        ALTER TABLE public.plans ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- 4. 'STARTER' PLANINI EKLE (Fiyat: 0, Komisyon: %15)
-- Frontend bu JSON yapısını bekliyor, o yüzden bozmuyoruz.
INSERT INTO public.plans (name, price, features)
VALUES ('starter', 0, '{"commission_rate": 0.15, "description": "Gezgin Paket - Risksiz Başlangıç"}'::jsonb)
ON CONFLICT (name) DO UPDATE 
SET features = EXCLUDED.features, price = EXCLUDED.price; 
-- (Varsa bilgilerini günceller, böylece eski hatalı veri kalmaz)

-- 5. ABONELİK (USER PLANS) TABLOSU
CREATE TABLE IF NOT EXISTS public.user_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TOPLULUK TABLOSU GÜNCELLEMESİ (Circle Özellikleri)
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS enabled_features JSONB DEFAULT '{
    "discussions": true,
    "events": true,
    "chat": true,
    "courses": false,
    "paid_memberships": false,
    "gamification": true
}'::jsonb;

-- 7. GÜVENLİK (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Plans viewable by everyone" ON public.plans;
CREATE POLICY "Plans viewable by everyone" ON public.plans FOR SELECT USING (true);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own plans" ON public.user_plans;
CREATE POLICY "Users view own plans" ON public.user_plans FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update community settings" ON public.communities;
CREATE POLICY "Owners can update community settings" 
ON public.communities FOR UPDATE
USING (owner_id = auth.uid());
