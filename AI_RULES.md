# Regras para Desenvolvimento de Aplicações - MaiaCred

Este documento descreve a pilha tecnológica utilizada no projeto MaiaCred e as diretrizes para o uso de bibliotecas e ferramentas.

## 🚀 Pilha Tecnológica

O projeto MaiaCred é construído com as seguintes tecnologias:

*   **Vite**: Ferramenta de build rápida e moderna para desenvolvimento front-end.
*   **TypeScript**: Linguagem de programação que adiciona tipagem estática ao JavaScript, melhorando a robustez e manutenibilidade do código.
*   **React**: Biblioteca JavaScript para construção de interfaces de usuário interativas e reativas.
*   **React Router**: Biblioteca para gerenciamento de rotas no lado do cliente, permitindo navegação entre diferentes páginas da aplicação.
*   **Tailwind CSS**: Framework CSS utilitário para estilização rápida e responsiva de componentes.
*   **shadcn/ui**: Coleção de componentes de UI reutilizáveis e acessíveis, construídos com Radix UI e estilizados com Tailwind CSS.
*   **Supabase**: Plataforma de backend-as-a-service que oferece banco de dados PostgreSQL, autenticação, armazenamento de arquivos e APIs em tempo real.
*   **TanStack Query (React Query)**: Biblioteca para gerenciamento de estado do servidor, facilitando a busca, cache, sincronização e atualização de dados.
*   **Zod**: Biblioteca de validação de esquemas para garantir a integridade dos dados de formulários e APIs.
*   **React Hook Form**: Biblioteca para gerenciamento de formulários, simplificando a validação e o manuseio de inputs.
*   **Lucide React**: Biblioteca de ícones leves e personalizáveis para uso em toda a aplicação.
*   **Sonner**: Biblioteca para exibição de notificações toast elegantes e personalizáveis.
*   **Recharts**: Biblioteca de gráficos para visualização de dados em dashboards e relatórios.
*   **Date-fns**: Biblioteca utilitária para manipulação e formatação de datas.

## 📚 Regras de Uso de Bibliotecas

Para manter a consistência, performance e manutenibilidade do código, siga as seguintes regras ao utilizar as bibliotecas:

*   **Componentes de UI**:
    *   **Prioridade**: Sempre utilize os componentes da biblioteca `shadcn/ui` (`src/components/ui/`) para construir a interface do usuário.
    *   **Extensão**: Se um componente `shadcn/ui` não atender a uma necessidade específica ou precisar de modificações, crie um **novo componente** em `src/components/` e estilize-o com Tailwind CSS. **Nunca edite os arquivos originais em `src/components/ui/`**.
*   **Estilização**:
    *   Utilize **exclusivamente Tailwind CSS** para toda a estilização da aplicação. Evite CSS customizado ou outras bibliotecas de estilo.
*   **Gerenciamento de Estado**:
    *   **Estado Global da Aplicação**: Para autenticação e dados globais, utilize o **React Context** (ex: `AuthContext`, `DataContext`).
    *   **Estado do Servidor**: Para busca, cache, sincronização e atualização de dados do backend, utilize **TanStack Query (React Query)**.
    *   **Estado Local de Componentes**: Para estados internos de componentes, utilize `useState` e `useReducer` do React.
*   **Formulários**:
    *   Utilize **React Hook Form** para gerenciar o estado e a lógica de todos os formulários.
    *   Utilize **Zod** para definir os esquemas de validação dos formulários.
*   **Roteamento**:
    *   Utilize **React Router** para todas as funcionalidades de navegação. As rotas devem ser definidas em `src/App.tsx`.
*   **Interação com Backend**:
    *   Todas as interações com o banco de dados, autenticação e armazenamento de arquivos devem ser feitas através do cliente **Supabase** (`@supabase/supabase-js`).
*   **Ícones**:
    *   Utilize a biblioteca **Lucide React** para todos os ícones da aplicação.
*   **Notificações**:
    *   Para exibir mensagens de feedback ao usuário (sucesso, erro, informação), utilize a biblioteca **Sonner**.
*   **Gráficos**:
    *   Para visualização de dados em gráficos, utilize a biblioteca **Recharts**.
*   **Datas**:
    *   Para formatação, parse e manipulação de datas, utilize a biblioteca **Date-fns**.