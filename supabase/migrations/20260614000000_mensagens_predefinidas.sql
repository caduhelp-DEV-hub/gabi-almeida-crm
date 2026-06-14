CREATE TABLE IF NOT EXISTS public.mensagens_predefinidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.mensagens_predefinidas ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (similar to how some other tables are set up for fast iteration, though in prod policies should be strict)
CREATE POLICY "Allow public read access" ON public.mensagens_predefinidas FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.mensagens_predefinidas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.mensagens_predefinidas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.mensagens_predefinidas FOR DELETE USING (true);
