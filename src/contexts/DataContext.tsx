import React, { createContext, useContext, useState, useEffect } from 'react';

interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: string;
  dataNascimento: string;
  observacoes?: string;
  contratos: number;
  status: 'ativo' | 'inativo';
}

interface Banco {
  id: string;
  nome: string;
  codigo: string;
  taxaMedia: number;
  contato: string;
  telefoneContato: string;
  observacoes: string;
  contratos: number;
  volumeTotal: string;
  status: 'ativo' | 'inativo';
}

interface Contrato {
  id: string;
  clienteId: string;
  clienteNome: string;
  bancoId: string;
  bancoNome: string;
  tipoContrato: string;
  dataEmprestimo: string;
  valorTotal: number;
  parcelas: number;
  valorParcela: string;
  taxa: number;
  receitaAgente: string;
  status: 'ativo' | 'pendente' | 'finalizado';
  observacoes?: string;
}

interface DataContextType {
  clientes: Cliente[];
  bancos: Banco[];
  contratos: Contrato[];
  metaAnual: number;
  addCliente: (cliente: Omit<Cliente, 'id' | 'contratos' | 'status'>) => void;
  updateCliente: (id: string, cliente: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;
  addBanco: (banco: Omit<Banco, 'id' | 'contratos' | 'volumeTotal' | 'status'>) => void;
  updateBanco: (id: string, banco: Partial<Banco>) => void;
  deleteBanco: (id: string) => void;
  addContrato: (contrato: Omit<Contrato, 'id' | 'clienteNome' | 'bancoNome' | 'valorParcela' | 'receitaAgente' | 'status'>) => void;
  updateContrato: (id: string, contrato: Partial<Contrato>) => void;
  deleteContrato: (id: string) => void;
  updateMetaAnual: (meta: number) => void;
  getClienteById: (id: string) => Cliente | undefined;
  getBancoById: (id: string) => Banco | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
}

// Dados iniciais (mock)
const initialClientes: Cliente[] = [
  {
    id: '1',
    nome: 'Maria Silva Santos',
    cpf: '123.456.789-09',
    telefone: '(11) 99999-9999',
    email: 'maria@email.com',
    endereco: 'Rua das Flores, 123 - São Paulo/SP',
    dataNascimento: '15/03/1985',
    contratos: 0,
    status: 'ativo'
  },
  {
    id: '2',
    nome: 'João Pedro Costa',
    cpf: '987.654.321-00',
    telefone: '(11) 88888-8888',
    email: 'joao@email.com',
    endereco: 'Av. Paulista, 456 - São Paulo/SP',
    dataNascimento: '22/07/1990',
    contratos: 0,
    status: 'ativo'
  },
  {
    id: '3',
    nome: 'Ana Carolina Lima',
    cpf: '456.789.123-00',
    telefone: '(11) 77777-7777',
    email: 'ana@email.com',
    endereco: 'Rua Augusta, 789 - São Paulo/SP',
    dataNascimento: '08/12/1987',
    contratos: 0,
    status: 'ativo'
  }
];

const initialBancos: Banco[] = [
  {
    id: '1',
    nome: 'Banco do Brasil',
    codigo: '001',
    taxaMedia: 2.5,
    contato: 'João Silva',
    telefoneContato: '(11) 99999-1111',
    observacoes: 'Taxa média: 2,5% a.m. | Contato: João Silva - (11) 99999-1111',
    contratos: 0,
    volumeTotal: 'R$ 0',
    status: 'ativo'
  },
  {
    id: '2',
    nome: 'Itaú Unibanco',
    codigo: '341',
    taxaMedia: 2.8,
    contato: 'Maria Santos',
    telefoneContato: '(11) 88888-2222',
    observacoes: 'Taxa média: 2,8% a.m. | Aprovação rápida | Contato: Maria Santos',
    contratos: 0,
    volumeTotal: 'R$ 0',
    status: 'ativo'
  },
  {
    id: '3',
    nome: 'Bradesco',
    codigo: '237',
    taxaMedia: 3.0,
    contato: 'Pedro Oliveira',
    telefoneContato: '(11) 77777-3333',
    observacoes: 'Taxa média: 3,0% a.m. | Bom para aposentados',
    contratos: 0,
    volumeTotal: 'R$ 0',
    status: 'ativo'
  },
  {
    id: '4',
    nome: 'Santander',
    codigo: '033',
    taxaMedia: 2.7,
    contato: 'Pedro Lima',
    telefoneContato: '(11) 66666-4444',
    observacoes: 'Taxa média: 2,7% a.m. | Processo lento | Contato: Pedro Lima',
    contratos: 0,
    volumeTotal: 'R$ 0',
    status: 'ativo'
  },
  {
    id: '5',
    nome: 'Caixa Econômica Federal',
    codigo: '104',
    taxaMedia: 2.2,
    contato: 'Ana Costa',
    telefoneContato: '(11) 55555-5555',
    observacoes: 'Taxa média: 2,2% a.m. | Melhor para servidores públicos',
    contratos: 0,
    volumeTotal: 'R$ 0',
    status: 'inativo'
  }
];

// Sistema iniciará sem contratos - todos serão cadastrados pelo usuário
const initialContratos: Contrato[] = [];

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  // Forçar limpeza completa dos dados - SEMPRE limpar ao carregar
  useEffect(() => {
    // Limpa TODOS os dados do sistema para garantir início limpo
    localStorage.removeItem('maiacred_clientes');
    localStorage.removeItem('maiacred_bancos');
    localStorage.removeItem('maiacred_contratos');
    localStorage.removeItem('maiacred_meta_anual');
    localStorage.removeItem('maiacred_cleared');
    console.log('✅ Sistema limpo - todos os dados foram resetados');
  }, []);

  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [bancos, setBancos] = useState<Banco[]>(initialBancos);
  const [contratos, setContratos] = useState<Contrato[]>(initialContratos);
  const [metaAnual, setMetaAnual] = useState<number>(180000); // Meta padrão de R$ 180.000 (R$ 15.000 x 12 meses)

  // Função para atualizar métricas dos bancos baseado nos contratos reais
  const updateBancoMetrics = () => {
    setBancos(prev => prev.map(banco => {
      const contratosDoBanco = contratos.filter(c => c.bancoId === banco.id);
      const contratosAtivos = contratosDoBanco.filter(c => c.status === 'ativo');
      const volumeTotal = contratosDoBanco.reduce((acc, contrato) => acc + contrato.valorTotal, 0);
      
      // Determinar status baseado em contratos ativos
      const novoStatus = contratosAtivos.length > 0 ? 'ativo' : 'inativo';
      
      return {
        ...banco,
        contratos: contratosDoBanco.length,
        volumeTotal: `R$ ${volumeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status: novoStatus as 'ativo' | 'inativo'
      };
    }));
  };

  // Atualizar métricas dos bancos sempre que os contratos mudarem
  useEffect(() => {
    updateBancoMetrics();
  }, [contratos]);

  // Persistir dados no localStorage
  useEffect(() => {
    localStorage.setItem('maiacred_clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('maiacred_bancos', JSON.stringify(bancos));
  }, [bancos]);

  useEffect(() => {
    localStorage.setItem('maiacred_contratos', JSON.stringify(contratos));
  }, [contratos]);

  useEffect(() => {
    localStorage.setItem('maiacred_meta_anual', metaAnual.toString());
  }, [metaAnual]);

  const addCliente = (clienteData: Omit<Cliente, 'id' | 'contratos' | 'status'>) => {
    const novoCliente: Cliente = {
      ...clienteData,
      id: Date.now().toString(),
      contratos: 0,
      status: 'ativo'
    };
    setClientes(prev => [...prev, novoCliente]);
  };

  const updateCliente = (id: string, clienteData: Partial<Cliente>) => {
    setClientes(prev => prev.map(cliente => 
      cliente.id === id ? { ...cliente, ...clienteData } : cliente
    ));
  };

  const deleteCliente = (id: string) => {
    // Verificar se o cliente tem contratos ativos
    const contratosDoCLiente = contratos.filter(c => c.clienteId === id);
    if (contratosDoCLiente.length > 0) {
      throw new Error('Não é possível excluir um cliente que possui contratos. Exclua os contratos primeiro.');
    }
    
    setClientes(prev => prev.filter(cliente => cliente.id !== id));
  };

  const addBanco = (bancoData: Omit<Banco, 'id' | 'contratos' | 'volumeTotal' | 'status'>) => {
    const novoBanco: Banco = {
      ...bancoData,
      id: Date.now().toString(),
      contratos: 0,
      volumeTotal: 'R$ 0,00',
      status: 'inativo' // Inicia como inativo até ter contratos ativos
    };
    setBancos(prev => [...prev, novoBanco]);
  };

  const updateBanco = (id: string, bancoData: Partial<Banco>) => {
    setBancos(prev => prev.map(banco => 
      banco.id === id ? { ...banco, ...bancoData } : banco
    ));
  };

  const deleteBanco = (id: string) => {
    // Verificar se o banco tem contratos ativos
    const contratosDoBanco = contratos.filter(c => c.bancoId === id);
    if (contratosDoBanco.length > 0) {
      throw new Error('Não é possível excluir um banco que possui contratos. Exclua os contratos primeiro.');
    }
    
    setBancos(prev => prev.filter(banco => banco.id !== id));
  };

  const addContrato = (contratoData: Omit<Contrato, 'id' | 'clienteNome' | 'bancoNome' | 'valorParcela' | 'receitaAgente' | 'status'>) => {
    const cliente = clientes.find(c => c.id === contratoData.clienteId);
    const banco = bancos.find(b => b.id === contratoData.bancoId);
    
    if (!cliente || !banco) {
      throw new Error('Cliente ou banco não encontrado');
    }

    const valorParcela = contratoData.valorTotal / contratoData.parcelas;
    const receitaAgente = contratoData.valorTotal * (contratoData.taxa / 100);

    const novoContrato: Contrato = {
      ...contratoData,
      id: Date.now().toString(),
      clienteNome: cliente.nome,
      bancoNome: banco.nome,
      valorParcela: `R$ ${valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      receitaAgente: `R$ ${receitaAgente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      status: 'ativo'
    };

    setContratos(prev => [...prev, novoContrato]);

    // Atualizar contador de contratos do cliente
    updateCliente(contratoData.clienteId, {
      contratos: cliente.contratos + 1
    });
  };

  const updateContrato = (id: string, contratoData: Partial<Contrato>) => {
    setContratos(prev => prev.map(contrato => 
      contrato.id === id ? { ...contrato, ...contratoData } : contrato
    ));
  };

  const deleteContrato = (id: string) => {
    const contrato = contratos.find(c => c.id === id);
    if (contrato) {
      // Atualizar contador de contratos do cliente
      const cliente = clientes.find(c => c.id === contrato.clienteId);
      if (cliente && cliente.contratos > 0) {
        updateCliente(contrato.clienteId, {
          contratos: cliente.contratos - 1
        });
      }
    }
    
    setContratos(prev => prev.filter(contrato => contrato.id !== id));
  };

  const getClienteById = (id: string) => {
    return clientes.find(cliente => cliente.id === id);
  };

  const getBancoById = (id: string) => {
    return bancos.find(banco => banco.id === id);
  };

  const updateMetaAnual = (meta: number) => {
    setMetaAnual(meta);
  };

  const value: DataContextType = {
    clientes,
    bancos,
    contratos,
    metaAnual,
    addCliente,
    updateCliente,
    deleteCliente,
    addBanco,
    updateBanco,
    deleteBanco,
    addContrato,
    updateContrato,
    deleteContrato,
    updateMetaAnual,
    getClienteById,
    getBancoById
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}