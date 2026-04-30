-- Adiciona a coluna 'onde_pagar' na tabela 'lancamentos'
ALTER TABLE public.lancamentos 
ADD COLUMN onde_pagar VARCHAR(255);
