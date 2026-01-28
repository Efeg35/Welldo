-- =======================================================
-- FIX: AMBIGUOUS SUBQUERY IN UPDATE POLICY
-- =======================================================

-- Hata: "more than one row returned by a subquery used as an expression"
-- Sebebi: Önceki politikadaki "WHERE id = id" ifadesi belirsiz olduğu için tüm tabloyu döndürüyordu.
-- Çözüm: Alt sorguda tablo alias kullanarak ID eşleşmesini sabitlemek.

DROP POLICY IF EXISTS "Users can update their RSVP status" ON public.event_responses;

CREATE POLICY "Users can update their RSVP status"
ON public.event_responses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
    auth.uid() = user_id AND 
    (
        -- Kullanıcı checked_in_at değerini değiştiremez.
        -- Mevcut veritabanı değeri ile yeni değer aynı olmalı.
        checked_in_at IS NOT DISTINCT FROM (
            SELECT er.checked_in_at 
            FROM public.event_responses AS er 
            WHERE er.id = event_responses.id
        )
    )
);
