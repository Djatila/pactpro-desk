// Tipos de dados das APIs externas
export interface SelicData {
  valor: number;
  data: string;
}

export interface CdiData {
  valor: number;
  data: string;
}

export interface IpcaData {
  valor: number;
  mes: string;
  ano: string;
}

export interface CambioData {
  valor: number;
  data: string;
}

export interface NoticiaFinanceira {
  titulo: string;
  fonte: string;
  data: string;
  url?: string;
}

// Tipos de notificação financeira
export interface NotificacaoFinanceira {
  id: string;
  tipo: 'SELIC' | 'CDI' | 'IPCA' | 'CAMBIO' | 'NOTICIA';
  categoria: 'institucional' | 'mercado';
  titulo: string;
  fonte: string;
  dataHora: string;
  lida: boolean;
  valor?: number;
  unidade?: string;
  url?: string;
}

// Serviços para buscar dados das APIs externas
export class NotificacoesFinanceirasService {
  private static instance: NotificacoesFinanceirasService;
  private notificacoes: NotificacaoFinanceira[] = [];

  static getInstance(): NotificacoesFinanceirasService {
    if (!this.instance) {
      this.instance = new NotificacoesFinanceirasService();
    }
    return this.instance;
  }

  private constructor() {
    // Carregar notificações do localStorage
    this.carregarNotificacoes();
    
    // Iniciar busca periódica
    this.iniciarBuscaPeriodica();
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

  private async buscarSelic(): Promise<SelicData | null> {
    try {
      // Simular dados da API do BACEN SGS
      // URL real seria: https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json
      console.log('🔄 Simulando busca da SELIC...');
      
      // Dados simulados
      const selicAtual = {
        valor: 10.50,
        data: new Date().toISOString().split('T')[0]
      };
      
      return selicAtual;
    } catch (error) {
      console.error('Erro ao buscar SELIC:', error);
      return null;
    }
  }

  private async buscarCDI(): Promise<CdiData | null> {
    try {
      console.log('🔄 Simulando busca do CDI...');
      
      // Dados simulados
      const cdiAtual = {
        valor: 10.25,
        data: new Date().toISOString().split('T')[0]
      };
      
      return cdiAtual;
    } catch (error) {
      console.error('Erro ao buscar CDI:', error);
      return null;
    }
  }

  private async buscarIPCA(): Promise<IpcaData | null> {
    try {
      console.log('🔄 Simulando busca do IPCA...');
      
      // Dados simulados
      const hoje = new Date();
      const ipcaAtual = {
        valor: 4.87,
        mes: (hoje.getMonth() + 1).toString().padStart(2, '0'),
        ano: hoje.getFullYear().toString()
      };
      
      return ipcaAtual;
    } catch (error) {
      console.error('Erro ao buscar IPCA:', error);
      return null;
    }
  }

  private async buscarCambio(): Promise<CambioData | null> {
    try {
      console.log('🔄 Simulando busca do câmbio USD/BRL...');
      
      // Dados simulados
      const cambioAtual = {
        valor: 5.45,
        data: new Date().toISOString().split('T')[0]
      };
      
      return cambioAtual;
    } catch (error) {
      console.error('Erro ao buscar câmbio:', error);
      return null;
    }
  }

  private async buscarNoticiasFinanceiras(): Promise<NoticiaFinanceira[]> {
    try {
      console.log('🔄 Simulando busca de notícias financeiras...');
      
      // Dados simulados
      const noticias: NoticiaFinanceira[] = [
        {
          titulo: 'Mercado prevê queda de juros para dezembro',
          fonte: 'InfoMoney',
          data: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          titulo: 'Inflação acima do esperado preocupa analistas',
          fonte: 'Valor Econômico',
          data: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      return noticias;
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      return [];
    }
  }

  private criarNotificacao(
    tipo: NotificacaoFinanceira['tipo'],
    categoria: NotificacaoFinanceira['categoria'],
    titulo: string,
    fonte: string,
    valor?: number,
    unidade?: string,
    url?: string
  ): NotificacaoFinanceira {
    return {
      id: `${tipo}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipo,
      categoria,
      titulo,
      fonte,
      dataHora: new Date().toISOString(),
      lida: false,
      valor,
      unidade,
      url
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
    console.log('📡 Iniciando busca de notificações financeiras...');

    try {
      // Buscar dados institucionais
      const [selic, cdi, ipca, cambio] = await Promise.all([
        this.buscarSelic(),
        this.buscarCDI(),
        this.buscarIPCA(),
        this.buscarCambio()
      ]);

      // Processar SELIC
      if (selic) {
        const notificacao = this.criarNotificacao(
          'SELIC',
          'institucional',
          `Taxa Selic mantida em ${selic.valor.toFixed(2)}%`,
          'BACEN',
          selic.valor,
          '%'
        );
        this.adicionarNotificacao(notificacao);
      }

      // Processar CDI
      if (cdi) {
        const notificacao = this.criarNotificacao(
          'CDI',
          'institucional',
          `CDI registra ${cdi.valor.toFixed(2)}%`,
          'BACEN',
          cdi.valor,
          '%'
        );
        this.adicionarNotificacao(notificacao);
      }

      // Processar IPCA
      if (ipca) {
        const notificacao = this.criarNotificacao(
          'IPCA',
          'institucional',
          `IPCA acumulado em ${ipca.valor.toFixed(2)}%`,
          'IBGE',
          ipca.valor,
          '%'
        );
        this.adicionarNotificacao(notificacao);
      }

      // Processar Câmbio
      if (cambio) {
        const notificacao = this.criarNotificacao(
          'CAMBIO',
          'institucional',
          `Dólar cotado a R$ ${cambio.valor.toFixed(2)}`,
          'BACEN',
          cambio.valor,
          'BRL'
        );
        this.adicionarNotificacao(notificacao);
      }

      // Buscar notícias do mercado
      const noticias = await this.buscarNoticiasFinanceiras();
      noticias.forEach(noticia => {
        const notificacao = this.criarNotificacao(
          'NOTICIA',
          'mercado',
          noticia.titulo,
          noticia.fonte,
          undefined,
          undefined,
          noticia.url
        );
        this.adicionarNotificacao(notificacao);
      });

      console.log(`📊 Processamento concluído. Total de notificações: ${this.notificacoes.length}`);

    } catch (error) {
      console.error('Erro durante busca de notificações:', error);
    }
  }

  private iniciarBuscaPeriodica() {
    // Buscar imediatamente
    this.buscarTodasNotificacoes();

    // Configurar busca a cada 1 minuto (conforme solicitado)
    setInterval(() => {
      this.buscarTodasNotificacoes();
    }, 60 * 1000); // 60 segundos

    console.log('⏰ Busca periódica de notificações iniciada (a cada 1 minuto)');
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

  public getNotificacoesPorCategoria(categoria: 'institucional' | 'mercado'): NotificacaoFinanceira[] {
    return this.notificacoes.filter(n => n.categoria === categoria);
  }
}