-- Custom Enums
CREATE TYPE natureza_tipo AS ENUM ('ENTRADA', 'SAIDA');
CREATE TYPE lancamento_tipo AS ENUM ('FIXA', 'ESPORADICA', 'PARCELA');
CREATE TYPE ocorrencia_status AS ENUM ('PENDENTE', 'BAIXADA');

-- Function for automatic timestamp updates
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. USUARIOS (Linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nome VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. CATEGORIAS
CREATE TABLE categorias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR NOT NULL,
    cor VARCHAR(7) NOT NULL CONSTRAINT cor_format CHECK (cor ~* '^#[0-9A-Fa-f]{6}$'),
    icone VARCHAR,
    ordem INT DEFAULT 0,
    ativo BOOLEAN DEFAULT true NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. CONTATOS
CREATE TABLE contatos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR NOT NULL,
    email VARCHAR,
    ativo BOOLEAN DEFAULT true NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. LANCAMENTOS
CREATE TABLE lancamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    categoria_id UUID REFERENCES categorias(id) ON DELETE RESTRICT NOT NULL,
    contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
    nome VARCHAR NOT NULL,
    descricao TEXT,
    natureza natureza_tipo NOT NULL,
    tipo lancamento_tipo NOT NULL,
    total_parcelas INT,
    valor_base DECIMAL(10,2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    ativo BOOLEAN DEFAULT true NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Business Rules Constraints
    CONSTRAINT check_parcelas CHECK (
        (tipo = 'PARCELA' AND total_parcelas IS NOT NULL) OR 
        (tipo <> 'PARCELA' AND total_parcelas IS NULL)
    ),
    CONSTRAINT check_data_fim CHECK (
        (tipo = 'FIXA') OR 
        (tipo <> 'FIXA' AND data_fim IS NULL)
    )
);

-- 5. OCORRENCIAS
CREATE TABLE ocorrencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lancamento_id UUID REFERENCES lancamentos(id) ON DELETE CASCADE NOT NULL,
    numero_parcela INT,
    data_vencimento DATE NOT NULL,
    data_competencia DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    valor_editado DECIMAL(10,2),
    status ocorrencia_status DEFAULT 'PENDENTE' NOT NULL,
    cancelada BOOLEAN DEFAULT false NOT NULL,
    cancelada_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
    cancelada_em TIMESTAMP WITH TIME ZONE,
    data_baixa DATE,
    baixado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
    baixado_em TIMESTAMP WITH TIME ZONE,
    observacao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_categorias BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_contatos BEFORE UPDATE ON contatos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_lancamentos BEFORE UPDATE ON lancamentos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_ocorrencias BEFORE UPDATE ON ocorrencias FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for Categorias
CREATE POLICY "Users can manage their own categories" ON categorias 
    FOR ALL USING (auth.uid() = user_id);

-- Policies for Contatos
CREATE POLICY "Users can manage their own contacts" ON contatos 
    FOR ALL USING (auth.uid() = user_id);

-- Policies for Lancamentos
CREATE POLICY "Users can manage their own launches" ON lancamentos 
    FOR ALL USING (auth.uid() = user_id);

-- Policies for Ocorrencias (via relationship with lancamentos)
CREATE POLICY "Users can manage their own occurrences" ON ocorrencias 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lancamentos 
            WHERE lancamentos.id = ocorrencias.lancamento_id 
            AND lancamentos.user_id = auth.uid()
        )
    );

-- Trigger to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
