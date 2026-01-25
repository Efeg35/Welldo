-- Add position column to channels for ordering
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_channels_position ON public.channels("position");
