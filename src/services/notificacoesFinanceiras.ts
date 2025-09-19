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
  tipo: 'SELIC' | 'CDI' | 'IPCA' | 'CAMBIO' | 'POUPANCA' | 'IGPM' | 'PIB' | 'DESEMPREGO' | 'NOTICIA';
  categoria: 'institucional' | 'mercado';
  titulo: string;
  fonte: string;
  dataHora: string;
  lida: boolean;
  valor?: number;
  unidade?: string;
  url?: string;
  variacao?: number; // Para mostrar se subiu/desceu
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

  private async buscarPoupanca(): Promise<PoupancaData | null> {
    try {
      console.log('🔄 Simulando busca da Poupança...');
      
      // Simular dados da API do BACEN
      const poupancaAtual = {
        valor: 0.6234, // Taxa mensal
        data: new Date().toISOString().split('T')[0]
      };
      
      return poupancaAtual;
    } catch (error) {
      console.error('Erro ao buscar Poupança:', error);
      return null;
    }
  }

  private async buscarIGPM(): Promise<IGPMData | null> {
    try {
      console.log('🔄 Simulando busca do IGP-M...');
      
      const igpmAtual = {
        valor: 0.45, // Variação mensal
        mes: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
        ano: new Date().getFullYear().toString()
      };
      
      return igpmAtual;
    } catch (error) {
      console.error('Erro ao buscar IGP-M:', error);
      return null;
    }
  }

  private async buscarPIB(): Promise<PIBData | null> {
    try {
      console.log('🔄 Simulando busca do PIB...');
      
      const pibAtual = {
        valor: 2.1, // Crescimento trimestral
        trimestre: '3º trimestre',
        ano: new Date().getFullYear().toString()
      };
      
      return pibAtual;
    } catch (error) {
      console.error('Erro ao buscar PIB:', error);
      return null;
    }
  }

  private async buscarDesemprego(): Promise<DesempregoData | null> {
    try {
      console.log('🔄 Simulando busca da Taxa de Desemprego...');
      
      const desempregoAtual = {
        valor: 7.8, // Taxa de desemprego
        mes: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
        ano: new Date().getFullYear().toString()
      };
      
      return desempregoAtual;
    } catch (error) {
      console.error('Erro ao buscar Taxa de Desemprego:', error);
      return null;
    }
  }

  private async buscarNoticiasFinanceiras(): Promise<NoticiaFinanceira[]> {
    try {
      console.log('🔄 Simulando busca de notícias financeiras...');
      
      // Notícias mais realistas e variadas
      const noticiasPool = [
        {
          titulo: 'Dólar fecha em alta de 0,8% cotado a R$ 5,45',
          fonte: 'InfoMoney',
          data: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString()
        },
        {
          titulo: 'Banco Central mantém Selic em 10,75% ao ano',
          fonte: 'Valor Econômico',
          data: new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000).toISOString()
        },
        {
          titulo: 'IPCA acumula alta de 4,2% em 12 meses',
          fonte: 'G1 Economia',
          data: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toISOString()
        },
        {
          titulo: 'Ibovespa sobe 1,2% e fecha acima dos 125 mil pontos',
          fonte: 'UOL Economia',
          data: new Date(Date.now() - Math.random() * 3 * 60 * 60 * 1000).toISOString()
        },
        {
          titulo: 'PIB brasileiro cresce 0,9% no terceiro trimestre',
          fonte: 'CNN Brasil',
          data: new Date(Date.now() - Math.random() * 5 * 60 * 60 * 1000).toISOString()
        },
        {
          titulo: 'Taxa de desemprego cai para 7,8% no trimestre',
          fonte: 'Folha de S.Paulo',
          data: new Date(Date.now() - Math.random() * 7 * 60 * 60 * 1000).toISOString()
        },
        {
          titulo: 'Petróleo Brent sobe 2,1% com tensões geopolíticas',
          fonte: 'Reuters Brasil',
          data: new Date(Date.now() - Math.random() * 1 * 60 * 60 * 1000).toISOString()
        },
        {
          titulo: 'Bitcoin ultrapassa US$ 95.000 em nova máxima histórica',
          fonte: 'CoinTelegraph',
          data: new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // Retornar 2-4 notícias aleatórias
      const numNoticias = Math.floor(Math.random() * 3) + 2;
      const noticiasEscolhidas = noticiasPool
        .sort(() => Math.random() - 0.5)
        .slice(0, numNoticias);
      
      return noticiasEscolhidas;
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
      // Buscar todos os dados institucionais e do IBGE
      const [selic, cdi, ipca, cambio, poupanca, igpm, pib, desemprego] = await Promise.all([
        this.buscarSelic(),
        this.buscarCDI(),
        this.buscarIPCA(),
        this.buscarCambio(),
        this.buscarPoupanca(),
        this.buscarIGPM(),
        this.buscarPIB(),
        this.buscarDesemprego()
      ]);

      // Processar SELIC
      if (selic) {
        const variacao = (Math.random() - 0.5) * 0.5; // Variação aleatória
        const notificacao = this.criarNotificacao(
          'SELIC',
          'institucional',
          `Taxa Selic ${variacao >= 0 ? 'sobe' : 'cai'} para ${selic.valor.toFixed(2)}%`,
          'BACEN',
          selic.valor,
          '%'
        );
        notificacao.variacao = variacao;
        this.adicionarNotificacao(notificacao);
      }

      // Processar CDI
      if (cdi) {
        const variacao = (Math.random() - 0.5) * 0.3;
        const notificacao = this.criarNotificacao(
          'CDI',
          'institucional',
          `CDI registra ${variacao >= 0 ? 'alta' : 'queda'} de ${Math.abs(variacao).toFixed(2)}%`,
          'CETIP',
          cdi.valor,
          '%'
        );
        notificacao.variacao = variacao;
        this.adicionarNotificacao(notificacao);
      }

      // Processar IPCA
      if (ipca) {
        const notificacao = this.criarNotificacao(
          'IPCA',
          'institucional',
          `IPCA acumula ${ipca.valor.toFixed(2)}% em 12 meses`,
          'IBGE',
          ipca.valor,
          '%'
        );
        this.adicionarNotificacao(notificacao);
      }

      // Processar Câmbio (Dólar)
      if (cambio) {
        const variacao = (Math.random() - 0.5) * 0.1;
        const notificacao = this.criarNotificacao(
          'CAMBIO',
          'mercado',
          `Dólar ${variacao >= 0 ? 'sobe' : 'cai'} ${Math.abs(variacao * 100).toFixed(1)}% e fecha a R$ ${cambio.valor.toFixed(2)}`,
          'BACEN',
          cambio.valor,
          'BRL'
        );
        notificacao.variacao = variacao;
        this.adicionarNotificacao(notificacao);
      }

      // Processar Poupança
      if (poupanca) {
        const notificacao = this.criarNotificacao(
          'POUPANCA',
          'institucional',
          `Poupança rende ${poupanca.valor.toFixed(4)}% no mês`,
          'BACEN',
          poupanca.valor,
          '%'
        );
        this.adicionarNotificacao(notificacao);
      }

      // Processar IGP-M
      if (igpm) {
        const notificacao = this.criarNotificacao(
          'IGPM',
          'institucional',
          `IGP-M registra ${igpm.valor >= 0 ? 'alta' : 'deflação'} de ${Math.abs(igpm.valor).toFixed(2)}% em ${igpm.mes}`,
          'FGV',
          igpm.valor,
          '%'
        );
        this.adicionarNotificacao(notificacao);
      }

      // Processar PIB
      if (pib) {
        const notificacao = this.criarNotificacao(
          'PIB',
          'institucional',
          `PIB brasileiro ${pib.valor >= 0 ? 'cresce' : 'recua'} ${Math.abs(pib.valor).toFixed(1)}% no ${pib.trimestre}`,
          'IBGE',
          pib.valor,
          '%'
        );
        this.adicionarNotificacao(notificacao);
      }

      // Processar Taxa de Desemprego
      if (desemprego) {
        const notificacao = this.criarNotificacao(
          'DESEMPREGO',
          'institucional',
          `Taxa de desemprego ${Math.random() > 0.5 ? 'cai' : 'sobe'} para ${desemprego.valor}% em ${desemprego.mes}`,
          'IBGE',
          desemprego.valor,
          '%'
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