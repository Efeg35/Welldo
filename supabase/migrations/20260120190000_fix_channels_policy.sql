-- Allow community owners to manage channels (Insert, Update, Delete)
CREATE POLICY "Community owners can manage channels"
    ON public.channels
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- Also ensure authenticated users can insert if they are the owner (redundant with ALL but good for clarity if split)
-- The above covers INSERT because 'community_id' is in the row being inserted.
-- For INSERT, the 'USING' clause checks the new row's community_id.
