# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/82f7500a-8cff-45b3-b667-54a4b67751cc

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/82f7500a-8cff-45b3-b667-54a4b67751cc) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Configuração Adicional Necessária

### Configuração do Storage do Supabase para Upload de PDFs

Para que o recurso de upload de PDFs funcione corretamente, é necessário configurar o storage do Supabase:

1. Acesse o painel do Supabase
2. Crie um bucket chamado `contratos-pdfs`
3. Configure as permissões apropriadas para o bucket
4. Habilite URLs públicas para permitir download dos PDFs

Instruções detalhadas estão disponíveis no arquivo [SUPABASE_STORAGE_SETUP.md](./SUPABASE_STORAGE_SETUP.md)

### Migração do Banco de Dados

Se estiver atualizando de uma versão anterior, execute o script de migração [PDF_FIELDS_MIGRATION.sql](./PDF_FIELDS_MIGRATION.sql) para adicionar os campos necessários à tabela de contratos.

## Arquivos de Documentação e Suporte

- [SUPABASE_STORAGE_SETUP.md](./SUPABASE_STORAGE_SETUP.md) - Instruções detalhadas para configurar o storage do Supabase
- [PDF_FIELDS_MIGRATION.sql](./PDF_FIELDS_MIGRATION.sql) - Script SQL para adicionar campos de PDF à tabela de contratos
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Guia de solução de problemas comuns
- [StorageSetupInstructions.tsx](./src/components/StorageSetupInstructions.tsx) - Componente React com instruções visuais

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/82f7500a-8cff-45b3-b667-54a4b67751cc) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)