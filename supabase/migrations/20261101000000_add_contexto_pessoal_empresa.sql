-- 1. Cria o tipo ENUM para o contexto financeiro (PESSOAL ou EMPRESA)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contexto_financeiro') THEN
        CREATE TYPE contexto_financeiro AS ENUM ('PESSOAL', 'EMPRESA');
    END IF;
END $$;

-- 2. Adiciona a coluna 'contexto' na tabela 'lancamentos'
ALTER TABLE public.lancamentos 
ADD COLUMN IF NOT EXISTS contexto contexto_financeiro NOT NULL DEFAULT 'PESSOAL';

-- 3. Índice para acelerar filtros por usuário e contexto
CREATE INDEX IF NOT EXISTS idx_lancamentos_user_contexto ON public.lancamentos(user_id, contexto);
