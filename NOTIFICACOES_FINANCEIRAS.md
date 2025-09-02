# Sistema de Notificações Financeiras - MaiaCred

## 📡 Visão Geral

O sistema de notificações financeiras do MaiaCred integra dados econômicos oficiais e notícias do mercado diretamente no painel de notificações existente. O sistema funciona com consultas automáticas a cada 1 minuto para manter os usuários atualizados sobre indicadores importantes.

## 🏗️ Arquitetura

### Componentes Principais

1. **NotificacoesFinanceirasService** (`src/services/notificacoesFinanceiras.ts`)
   - Serviço singleton responsável por buscar e processar dados das APIs externas
   - Gerencia cache local no localStorage
   - Executa buscas automáticas a cada minuto

2. **NotificacoesFinanceirasContext** (`src/contexts/NotificacoesFinanceirasContext.tsx`)
   - Contexto React para gerenciar estado global das notificações financeiras
   - Sincroniza com o serviço e atualiza componentes em tempo real

3. **NotificationCenter Expandido** (`src/components/NotificationCenter.tsx`)
   - Componente principal integrado ao header da aplicação
   - Agora inclui 3 abas: Contratos, Mercado e Histórico

## 🔌 Fontes de Dados

### Dados Institucionais (BACEN/IBGE)
- **SELIC**: Taxa básica de juros
- **CDI**: Certificado de Depósito Interbancário  
- **IPCA**: Índice de Preços ao Consumidor Amplo
- **Câmbio**: Cotação USD/BRL

### Notícias de Mercado
- InfoMoney
- Valor Econômico
- Feeds financeiros especializados

## 🎯 Funcionalidades

### Interface do Usuário

#### Sino de Notificações 🔔
- **Badge vermelho**: Mostra total de notificações não lidas (contratos + financeiras)
- **Posicionamento**: Header superior direito, ao lado do avatar do usuário

#### Sistema de Abas
1. **Contratos**: Notificações de vencimentos (3, 2, 1 mês)
2. **Mercado**: Dados institucionais e notícias financeiras
3. **Histórico**: Arquivo de notificações antigas

#### Categorias de Notificações Financeiras

**🏛️ Institucional** (Fundo azul)
- Taxa Selic mantida em 10,50% – BACEN (14h30)
- CDI registra 10,25% – BACEN (14h00)
- IPCA acumulado em 4,87% – IBGE (08h00)

**📈 Mercado** (Fundo laranja)
- Mercado prevê queda de juros – InfoMoney (09h00)
- Inflação acima do esperado – Valor (08h00)

## ⚙️ Configurações Técnicas

### Intervalos de Atualização
- **Busca de dados**: A cada 1 minuto
- **Sincronização UI**: A cada 30 segundos
- **Cache local**: Persistido no localStorage

### Gestão de Dados
- **Limite de notificações**: 50 mais recentes
- **Dedupliacação**: Evita notificações similares em 2 horas
- **Persistência**: localStorage para funcionamento offline

### Estados de Notificação
- `lida: boolean` - Controla se foi visualizada
- `categoria: 'institucional' | 'mercado'` - Tipo de notificação
- `tipo: 'SELIC' | 'CDI' | 'IPCA' | 'CAMBIO' | 'NOTICIA'` - Subtipo específico

## 🚀 Implementação

### Integração no App
```typescript
// App.tsx
<NotificacoesFinanceirasProvider>
  <TooltipProvider>
    {/* resto da aplicação */}
  </TooltipProvider>
</NotificacoesFinanceirasProvider>
```

### Uso do Hook
```typescript
// Em qualquer componente
const {
  notificacoes,
  notificacoesNaoLidas,
  totalNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas
} = useNotificacoesFinanceiras();
```

## 📊 Exemplos de Uso

### Visualização no Dropdown
```
🔔 3
-----------------------
🏛️ Institucional
• Taxa Selic mantida em 10,50% – BACEN (14h30)
• CDI registra 10,25% – BACEN (14h00)

📈 Mercado  
• Mercado prevê queda de juros – InfoMoney (09h00)
• Inflação acima do esperado – IBGE (08h00)
-----------------------
Ver todas notificações
```

## 🔧 APIs Integradas (Simuladas)

### BACEN SGS (Sistema Gerenciador de Séries)
- **SELIC**: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json`
- **CDI**: API similar do BACEN
- **Câmbio**: Cotações oficiais

### IBGE
- **IPCA**: APIs de indicadores econômicos do IBGE

### Feeds de Notícias
- APIs de agregadores financeiros
- RSS feeds de portais especializados

## 🛠️ Desenvolvimento Futuro

### Próximas Funcionalidades
1. **Modal de Histórico Completo**: Visualização expandida com filtros
2. **APIs Reais**: Integração com endpoints reais (atualmente simulado)
3. **Configurações de Usuário**: Personalizar tipos de notificação
4. **Push Notifications**: Notificações do navegador
5. **Widgets de Mercado**: Mini painéis com indicadores

### Melhorias Planejadas
- Cache mais inteligente com TTL configurável
- Retry automático em caso de falhas de API
- Compressão de dados para otimizar localStorage
- Análise de sentimento em notícias

## 🚨 Considerações Importantes

### Performance
- O serviço roda em background e não bloqueia a UI
- Uso eficiente do localStorage com limite de 50 notificações
- Dedupliacação inteligente evita spam

### Resiliência
- Funciona offline usando cache local
- Falhas de API não afetam funcionalidades principais
- Logs detalhados para debug e monitoramento

### Segurança
- Dados públicos apenas (sem informações sensíveis)
- Validação de dados recebidos das APIs
- Rate limiting implícito via intervalo de 1 minuto