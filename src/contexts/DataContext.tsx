import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type {
  Cliente as ClienteDB,
  Banco as BancoDB,
  Contrato as ContratoDB,
  ClienteInsert,
  BancoInsert,
  ContratoInsert
} from '@/lib/database.types';

// Tipos para compatibilidade com a interface atual
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
  isLoading: boolean;
  error: string | null;
  addCliente: (cliente: Omit<Cliente, 'id' | 'contratos' | 'status'>) => Promise<boolean>;
  updateCliente: (id: string, cliente: Partial<Cliente>) => Promise<boolean>;
  deleteCliente: (id: string) => Promise<boolean>;
  addBanco: (banco: Omit<Banco, 'id' | 'contratos' | 'volumeTotal' | 'status'>) => Promise<boolean>;
  updateBanco: (id: string, banco: Partial<Banco>) => Promise<boolean>;
  deleteBanco: (id: string) => Promise<boolean>;
  addContrato: (contrato: Omit<Contrato, 'id' | 'clienteNome' | 'bancoNome' | 'valorParcela' | 'receitaAgente' | 'status'>) => Promise<boolean>;
  updateContrato: (id: string, contrato: Partial<Contrato>) => Promise<boolean>;
  deleteContrato: (id: string) => Promise<boolean>;
  updateMetaAnual: (meta: number) => Promise<boolean>;
  getClienteById: (id: string) => Cliente | undefined;
  getBancoById: (id: string) => Banco | undefined;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [metaAnual, setMetaAnual] = useState<number>(180000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados quando o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshData();
    } else {
      // Limpar dados quando não autenticado
      setClientes([]);
      setBancos([]);
      setContratos([]);
      setMetaAnual(180000);
    }
  }, [isAuthenticated, user]);

  const refreshData = async () => {
    if (!user) return;
    
    // Verificar se o Supabase está configurado
    if (!supabase || typeof supabase.from !== 'function') {
      console.warn('⚠️ Supabase não configurado. Dados não serão sincronizados.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadClientes(),
        loadBancos(),
        loadContratos(),
        loadMetaAnual()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');

      if (error) throw error;

      const clientesFormatted: Cliente[] = (data || []).map(cliente => ({
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
        telefone: cliente.telefone,
        email: cliente.email,
        endereco: cliente.endereco,
        dataNascimento: cliente.data_nascimento,
        observacoes: cliente.observacoes,
        status: cliente.status,
        contratos: 0 // Será calculado depois
      }));

      setClientes(clientesFormatted);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      throw error;
    }
  };

  const loadBancos = async () => {
    try {
      const { data, error } = await supabase
        .from('bancos')
        .select('*')
        .order('nome');

      if (error) throw error;

      const bancosFormatted: Banco[] = (data || []).map(banco => ({
        id: banco.id,
        nome: banco.nome,
        codigo: banco.codigo,
        taxaMedia: banco.taxa_media,
        contato: banco.contato,
        telefoneContato: banco.telefone_contato,
        observacoes: banco.observacoes,
        status: banco.status,
        contratos: 0, // Será calculado depois
        volumeTotal: 'R$ 0' // Será calculado depois
      }));

      setBancos(bancosFormatted);
    } catch (error) {
      console.error('Erro ao carregar bancos:', error);
      throw error;
    }
  };

  const loadContratos = async () => {
    try {
      const { data, error } = await supabase
        .from('contratos')
        .select(`
          *,
          clientes!contratos_cliente_id_fkey(nome),
          bancos!contratos_banco_id_fkey(nome)
        `)
        .order('data_emprestimo', { ascending: false });

      if (error) throw error;

      const contratosFormatted: Contrato[] = (data || []).map(contrato => {
        const valorParcela = contrato.valor_total / contrato.parcelas;
        const receitaAgente = (contrato.valor_total * (contrato.taxa / 100)) * 0.3; // 30% da receita

        return {
          id: contrato.id,
          clienteId: contrato.cliente_id,
          clienteNome: (contrato.clientes as any)?.nome || 'Cliente não encontrado',
          bancoId: contrato.banco_id,
          bancoNome: (contrato.bancos as any)?.nome || 'Banco não encontrado',
          tipoContrato: contrato.tipo_contrato,
          dataEmprestimo: contrato.data_emprestimo,
          valorTotal: contrato.valor_total,
          parcelas: contrato.parcelas,
          valorParcela: valorParcela.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }),
          taxa: contrato.taxa,
          receitaAgente: receitaAgente.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }),
          status: contrato.status,
          observacoes: contrato.observacoes
        };
      });

      setContratos(contratosFormatted);
      updateMetrics(contratosFormatted);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      throw error;
    }
  };

  const loadMetaAnual = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('meta_anual')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setMetaAnual(data.meta_anual);
      }
    } catch (error) {
      console.error('Erro ao carregar meta anual:', error);
    }
  };

  const updateMetrics = (contratos: Contrato[]) => {
    // Atualizar métricas dos clientes
    setClientes(prev => prev.map(cliente => ({
      ...cliente,
      contratos: contratos.filter(c => c.clienteId === cliente.id).length
    })));

    // Atualizar métricas dos bancos
    setBancos(prev => prev.map(banco => {
      const contratosBank = contratos.filter(c => c.bancoId === banco.id);
      const volumeTotal = contratosBank.reduce((sum, c) => sum + c.valorTotal, 0);
      
      return {
        ...banco,
        contratos: contratosBank.length,
        volumeTotal: volumeTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        })
      };
    }));
  };

  // Funções para CRUD de clientes
  const addCliente = async (clienteData: Omit<Cliente, 'id' | 'contratos' | 'status'>): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const clienteInsert: ClienteInsert = {
        nome: clienteData.nome,
        cpf: clienteData.cpf,
        telefone: clienteData.telefone,
        email: clienteData.email,
        endereco: clienteData.endereco,
        data_nascimento: clienteData.dataNascimento,
        observacoes: clienteData.observacoes,
        user_id: user.id
      };

      const { error } = await supabase
        .from('clientes')
        .insert([clienteInsert]);

      if (error) throw error;

      await loadClientes();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      setError('Erro ao adicionar cliente');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCliente = async (id: string, clienteData: Partial<Cliente>): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const updateData: any = {};
      if (clienteData.nome) updateData.nome = clienteData.nome;
      if (clienteData.cpf) updateData.cpf = clienteData.cpf;
      if (clienteData.telefone) updateData.telefone = clienteData.telefone;
      if (clienteData.email) updateData.email = clienteData.email;
      if (clienteData.endereco) updateData.endereco = clienteData.endereco;
      if (clienteData.dataNascimento) updateData.data_nascimento = clienteData.dataNascimento;
      if (clienteData.observacoes !== undefined) updateData.observacoes = clienteData.observacoes;
      if (clienteData.status) updateData.status = clienteData.status;

      const { error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await loadClientes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      setError('Erro ao atualizar cliente');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCliente = async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadClientes();
      await loadContratos(); // Recarregar contratos pois podem ter sido afetados
      return true;
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      setError('Erro ao deletar cliente');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Continua com as demais funções...
  const addBanco = async (bancoData: Omit<Banco, 'id' | 'contratos' | 'volumeTotal' | 'status'>): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const bancoInsert: BancoInsert = {
        nome: bancoData.nome,
        codigo: bancoData.codigo,
        taxa_media: bancoData.taxaMedia,
        contato: bancoData.contato,
        telefone_contato: bancoData.telefoneContato,
        observacoes: bancoData.observacoes,
        user_id: user.id
      };

      const { error } = await supabase
        .from('bancos')
        .insert([bancoInsert]);

      if (error) throw error;

      await loadBancos();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar banco:', error);
      setError('Erro ao adicionar banco');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBanco = async (id: string, bancoData: Partial<Banco>): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const updateData: any = {};
      if (bancoData.nome) updateData.nome = bancoData.nome;
      if (bancoData.codigo) updateData.codigo = bancoData.codigo;
      if (bancoData.taxaMedia !== undefined) updateData.taxa_media = bancoData.taxaMedia;
      if (bancoData.contato) updateData.contato = bancoData.contato;
      if (bancoData.telefoneContato) updateData.telefone_contato = bancoData.telefoneContato;
      if (bancoData.observacoes) updateData.observacoes = bancoData.observacoes;
      if (bancoData.status) updateData.status = bancoData.status;

      const { error } = await supabase
        .from('bancos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await loadBancos();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar banco:', error);
      setError('Erro ao atualizar banco');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBanco = async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('bancos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadBancos();
      await loadContratos(); // Recarregar contratos pois podem ter sido afetados
      return true;
    } catch (error) {
      console.error('Erro ao deletar banco:', error);
      setError('Erro ao deletar banco');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addContrato = async (contratoData: Omit<Contrato, 'id' | 'clienteNome' | 'bancoNome' | 'valorParcela' | 'receitaAgente' | 'status'>): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const contratoInsert: ContratoInsert = {
        cliente_id: contratoData.clienteId,
        banco_id: contratoData.bancoId,
        tipo_contrato: contratoData.tipoContrato,
        data_emprestimo: contratoData.dataEmprestimo,
        valor_total: contratoData.valorTotal,
        parcelas: contratoData.parcelas,
        taxa: contratoData.taxa,
        observacoes: contratoData.observacoes,
        user_id: user.id
      };

      const { error } = await supabase
        .from('contratos')
        .insert([contratoInsert]);

      if (error) throw error;

      await loadContratos();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar contrato:', error);
      setError('Erro ao adicionar contrato');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateContrato = async (id: string, contratoData: Partial<Contrato>): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const updateData: any = {};
      if (contratoData.clienteId) updateData.cliente_id = contratoData.clienteId;
      if (contratoData.bancoId) updateData.banco_id = contratoData.bancoId;
      if (contratoData.tipoContrato) updateData.tipo_contrato = contratoData.tipoContrato;
      if (contratoData.dataEmprestimo) updateData.data_emprestimo = contratoData.dataEmprestimo;
      if (contratoData.valorTotal !== undefined) updateData.valor_total = contratoData.valorTotal;
      if (contratoData.parcelas !== undefined) updateData.parcelas = contratoData.parcelas;
      if (contratoData.taxa !== undefined) updateData.taxa = contratoData.taxa;
      if (contratoData.status) updateData.status = contratoData.status;
      if (contratoData.observacoes !== undefined) updateData.observacoes = contratoData.observacoes;

      const { error } = await supabase
        .from('contratos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await loadContratos();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      setError('Erro ao atualizar contrato');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContrato = async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadContratos();
      return true;
    } catch (error) {
      console.error('Erro ao deletar contrato:', error);
      setError('Erro ao deletar contrato');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMetaAnual = async (meta: number): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert({ 
          user_id: user.id, 
          meta_anual: meta 
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setMetaAnual(meta);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar meta anual:', error);
      setError('Erro ao atualizar meta anual');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getClienteById = (id: string) => {
    return clientes.find(cliente => cliente.id === id);
  };

  const getBancoById = (id: string) => {
    return bancos.find(banco => banco.id === id);
  };

  const value: DataContextType = {
    clientes,
    bancos,
    contratos,
    metaAnual,
    isLoading,
    error,
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
    getBancoById,
    refreshData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}