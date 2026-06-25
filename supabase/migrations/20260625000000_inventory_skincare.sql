-- Add product type and pricing to inventory table for Skincare sales module
ALTER TABLE "public"."inventory"
ADD COLUMN IF NOT EXISTS "tipo_produto" text DEFAULT 'Industrializado',
ADD COLUMN IF NOT EXISTS "preco_venda" numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "preco_custo" numeric(10, 2) DEFAULT 0;
