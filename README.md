# 🥑 Abacate Family - Financial Intelligence

Uma plataforma moderna e sofisticada para gestão financeira pessoal e familiar, focada em inteligência de dados e experiência do usuário premium.

![Dashboard Preview](https://raw.githubusercontent.com/JOAO2001ARTHUR/abacate-family/master/public/preview.png) *(Placeholder - adicione um screenshot real)*

## 🚀 Tecnologias

Este projeto utiliza o que há de mais moderno no ecossistema web:

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Estilização:** [Tailwind CSS 4](https://tailwindcss.com/) (CSS-first engine)
- **Banco de Dados & Autenticação:** [Supabase](https://supabase.com/)
- **Gerenciamento de Estado:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Queries & Cache:** [TanStack Query v5](https://tanstack.com/query/latest)
- **Formulários:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Ícones:** [Lucide React](https://lucide.dev/)

## 📦 Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/JOAO2001ARTHUR/abacate-family.git
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env.local` na raiz do projeto com suas credenciais do Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=seu_url_do_supabase
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

Acesse [http://localhost:3000](http://localhost:3000) para ver o resultado.

## 🛠️ Estrutura do Projeto

- `/app`: Rotas e páginas da aplicação.
- `/components`: Componentes de UI reutilizáveis.
- `/hooks`: Hooks customizados para lógica de negócio.
- `/lib`: Configurações de bibliotecas (Supabase client, etc).
- `/stores`: Gerenciamento de estado global com Zustand.
- `/supabase`: Migrações e esquemas do banco de dados.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---
Desenvolvido com ❤️ pela equipe Abacate Family.
