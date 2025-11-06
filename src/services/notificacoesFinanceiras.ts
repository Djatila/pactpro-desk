// Tipos de dados para notificações
export interface NotificacaoFinanceira {
  id: string;
  tipo: 'CONTRATO';
  titulo: string;
  descricao: string;
  dataHora: string;
  lida: boolean;
  contratoId?: string;
  clienteId?: string;
  dataVencimento?: string;
  diasRestantes?: number;
}

// Serviço de notificações
export class NotificacoesFinanceirasService {
  private static instance: NotificacoesFinanceirasService;
  private notificacoes: NotificacaoFinanceira[] = [];
  private supabase: any;

  static getInstance(supabase?: any): NotificacoesFinanceirasService {
    if (!this.instance) {
      this.instance = new NotificacoesFinanceirasService(supabase);
    } else if (supabase) {
      this.instance.setSupabase(supabase);
    }
    return this.instance;
  }

  private constructor(supabase?: any) {
    this.supabase = supabase;
    this.carregarNotificacoes();
    this.iniciarBuscaPeriodica();
  }

  public setSupabase(supabase: any) {
    this.supabase = supabase;
  }

  private carregarNotificacoes() {
    try {
      const stored = localStorage.getItem('maiacred_notificacoes_financeiras');
      if (stored) {
        this.notificacoes = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Erro ao carregar notificações do localStorage:', error);
    }
  }

  private salvarNotificacoes() {
    try {
      localStorage.setItem('maiacred_notificacoes_financeiras', JSON.stringify(this.notificacoes));
    } catch (error) {
      console.warn('Erro ao salvar notificações no localStorage:', error);
    }
  }

  private async buscarContratosProximosVencimento() {
    if (!this.supabase) {
      console.warn('Supabase não está configurado para buscar contratos');
      return [];
    }

    try {
      // Buscar contratos com vencimento nos próximos 6 meses
      const hoje = new Date();
      const seisMesesAFrente = new Date();
      seisMesesAFrente.setMonth(hoje.getMonth() + 6);

      // Formatar datas para o formato YYYY-MM-DD
      const formatarData = (data: Date) => data.toISOString().split('T')[0];

      const { data: contratos, error } = await this.supabase
        .from('contratos')
        .select('id, cliente_id, primeiro_vencimento, clientes(nome)')
        .gte('primeiro_vencimento', formatarData(hoje))
        .lte('primeiro_vencimento', formatarData(seisMesesAFrente))
        .order('primeiro_vencimento', { ascending: true });

      if (error) throw error;

      // Processar contratos para criar notificações
      const notificacoes = (contratos || []).map(contrato => {
        const dataVencimento = new Date(contrato.primeiro_vencimento);
        const diffTime = dataVencimento.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return this.criarNotificacao(
          'CONTRATO',
          `Contrato próximo do vencimento`,
          `O contrato do cliente ${contrato.clientes?.nome || 'Cliente'} vence em ${diffDays} dia${diffDays > 1 ? 's' : ''}`,
          contrato.id,
          contrato.cliente_id,
          contrato.primeiro_vencimento,
          diffDays
        );
      });

      return notificacoes;
    } catch (error) {
      console.error('Erro ao buscar contratos próximos do vencimento:', error);
    }
  }


  private criarNotificacao(
    tipo: 'CONTRATO',
    titulo: string,
    descricao: string,
    contratoId: string,
    clienteId: string,
    dataVencimento: string,
    diasRestantes: number
  ): NotificacaoFinanceira {
    return {
      id: `${tipo}-${contratoId}-${Date.now()}`,
      tipo,
      titulo,
      descricao,
      dataHora: new Date().toISOString(),
      lida: false,
      contratoId,
      clienteId,
      dataVencimento,
      diasRestantes
    };
  }

  private adicionarNotificacao(notificacao: NotificacaoFinanceira) {
    // Verificar se já existe uma notificação similar recente (últimas 2 horas)
    const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const jaExiste = this.notificacoes.some(n => 
      n.tipo === notificacao.tipo && 
      new Date(n.dataHora) > duasHorasAtras
    );

    if (!jaExiste) {
      this.notificacoes.unshift(notificacao);
      
      // Manter apenas as últimas 50 notificações
      if (this.notificacoes.length > 50) {
        this.notificacoes = this.notificacoes.slice(0, 50);
      }
      
      this.salvarNotificacoes();
      console.log(`✅ Nova notificação adicionada: ${notificacao.titulo}`);
    }
  }

  public async buscarTodasNotificacoes() {
    console.log('🔍 Buscando contratos próximos do vencimento...');

    try {
      // Limpar notificações antigas de contratos
      this.notificacoes = this.notificacoes.filter(n => n.tipo !== 'CONTRATO');
      
      // Buscar contratos próximos do vencimento
      const notificacoesContratos = await this.buscarContratosProximosVencimento();
      
      // Adicionar novas notificações
      notificacoesContratos.forEach(notificacao => {
        this.adicionarNotificacao(notificacao);
      });

      console.log(`✅ ${notificacoesContratos.length} contrato(s) próximo(s) do vencimento encontrado(s)`);
      
    } catch (error) {
      console.error('Erro durante busca de contratos:', error);
    }
  }

  private iniciarBuscaPeriodica() {
    // Buscar imediatamente
    this.buscarTodasNotificacoes();

    // Configurar busca a cada 2 horas (não precisa verificar com tanta frequência)
    setInterval(() => {
      this.buscarTodasNotificacoes();
    }, 2 * 60 * 60 * 1000); // 2 horas

    console.log('⏰ Busca periódica de contratos próximos ao vencimento iniciada');
  }

  public getNotificacoes(): NotificacaoFinanceira[] {
    return [...this.notificacoes];
  }

  public getNotificacoesNaoLidas(): NotificacaoFinanceira[] {
    return this.notificacoes.filter(n => !n.lida);
  }

  public marcarComoLida(id: string) {
    const notificacao = this.notificacoes.find(n => n.id === id);
    if (notificacao) {
      notificacao.lida = true;
      this.salvarNotificacoes();
    }
  }

  public marcarTodasComoLidas() {
    this.notificacoes.forEach(n => n.lida = true);
    this.salvarNotificacoes();
  }

  public getNotificacoesPorTipo(tipo: 'CONTRATO'): NotificacaoFinanceira[] {
    return this.notificacoes.filter(n => n.tipo === tipo);
  }
}