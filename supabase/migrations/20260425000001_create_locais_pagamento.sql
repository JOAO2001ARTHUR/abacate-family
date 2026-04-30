-- 1. Cria a tabela locais_pagamento
CREATE TABLE locais_pagamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR NOT NULL,
    icone VARCHAR,
    ativo BOOLEAN DEFAULT true NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Trigger para atualizar atualizado_em
CREATE TRIGGER set_updated_at_locais_pagamento BEFORE UPDATE ON locais_pagamento FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 3. RLS para locais_pagamento
ALTER TABLE locais_pagamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own payment locations" ON locais_pagamento 
    FOR ALL USING (auth.uid() = user_id);

-- 4. Adiciona a coluna local_pagamento_id em lancamentos
ALTER TABLE lancamentos 
ADD COLUMN local_pagamento_id UUID REFERENCES locais_pagamento(id) ON DELETE SET NULL;

-- 5. Migração de dados (para preservar quaisquer valores já inseridos em onde_pagar)
-- a. Insere os locais de pagamento únicos
INSERT INTO locais_pagamento (user_id, nome)
SELECT DISTINCT user_id, onde_pagar
FROM lancamentos
WHERE onde_pagar IS NOT NULL AND onde_pagar != '';

-- b. Atualiza os lançamentos com o ID correspondente
UPDATE lancamentos l
SET local_pagamento_id = lp.id
FROM locais_pagamento lp
WHERE l.user_id = lp.user_id AND l.onde_pagar = lp.nome;

-- 6. Remove a coluna antiga onde_pagar
ALTER TABLE lancamentos 
DROP COLUMN onde_pagar;
