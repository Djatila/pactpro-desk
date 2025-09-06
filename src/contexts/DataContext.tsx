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
  // Novos campos
  primeiroVencimento: string;
  valorOperacao: number;
  valorSolicitado: number;
  valorPrestacao: number;
  // Campos para PDF
  pdfUrl?: string;
  pdfName?: string;
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
  // Função para upload de PDF
  uploadContratoPdf: (contratoId: string, file: File | null) => Promise<boolean>;
  // Função para download de PDF
  downloadContratoPdf: (contratoId: string) => Promise<void>;
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

  // Função utilitária para detectar erros de configuração
  const handleSupabaseError = (error: any, operation: string) => {
    console.error(`Erro ao ${operation}:`, error);
    
    if (error?.message?.includes('disabled') || error?.message?.includes('Feature is disabled')) {
      console.error('🚨 ERRO CRÍTICO: Função desabilitada no Supabase!');
      console.error('📋 SOLUÇÃO URGENTE:');
      console.error('   1. Acesse: https://supabase.com/dashboard');
      console.error('   2. Projeto: emvnudlonqoyfptrdwtd');
      console.error('   3. Authentication → Settings');
      console.error('   4. HABILITE: "Enable email provider"');
      console.error('   5. DESABILITE: "Confirm email" (para desenvolvimento)');
      console.error('   6. Site URL: http://localhost:8080');
      setError('CONFIGURAÇÃO NECESSÁRIA: Funcionalidade desabilitada no Supabase. Verifique o console (F12) para instruções.');
    } else if (error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
      console.warn('⚠️ Timeout na operação:', operation);
      setError('Problemas de conectividade. Tente novamente.');
    } else {
      setError(`Erro ao ${operation}`);
    }
  };

  // Carregar dados quando o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('🔄 DataContext: Carregando dados para usuário:', user.id);
      refreshData();
    } else {
      console.log('🧙 DataContext: Limpando dados - usuário não autenticado');
      // Limpar dados quando não autenticado
      setClientes([]);
      setBancos([]);
      setContratos([]);
      setMetaAnual(180000);
    }
  }, [isAuthenticated, user?.id]); // Usar user?.id em vez de user completo

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
      // Carregar bancos primeiro para garantir que o status definido manualmente seja preservado
      await loadBancos();
      await loadClientes();
      await loadContratos();
      await loadMetaAnual();
      
      // Versão anterior usando Promise.all estava causando condição de corrida
      // entre loadBancos e loadContratos (que chama updateMetrics)
      /*
      await Promise.all([
        loadClientes(),
        loadBancos(),
        loadContratos(),
        loadMetaAnual()
      ]);
      */
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
        status: banco.status, // Usar o status do banco diretamente do banco de dados
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
        const receitaAgente = contrato.valor_total * (contrato.taxa / 100);

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
            currency: 'BRL',
            minimumFractionDigits: 2
          }),
          taxa: contrato.taxa,
          receitaAgente: receitaAgente.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
          }),
          status: contrato.status,
          observacoes: contrato.observacoes,
          // Novos campos
          primeiroVencimento: contrato.primeiro_vencimento,
          valorOperacao: contrato.valor_operacao,
          valorSolicitado: contrato.valor_solicitado,
          valorPrestacao: contrato.valor_prestacao,
          // Campos para PDF
          pdfUrl: contrato.pdf_url,
          pdfName: contrato.pdf_name
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
    console.log('📊 Atualizando métricas dos bancos e clientes...');
    
    // Atualizar métricas dos clientes apenas se houver mudança
    setClientes(prev => {
      const updatedClientes = prev.map(cliente => {
        const clienteContratos = contratos.filter(c => c.clienteId === cliente.id);
        const newContratosCount = clienteContratos.length;
        
        // Determinar status automaticamente baseado na existência de contratos ativos
        const hasContratosAtivos = clienteContratos.some(c => c.status === 'ativo');
        const newStatus: 'ativo' | 'inativo' = hasContratosAtivos ? 'ativo' : 'inativo';
        
        // Só retornar novo objeto se realmente mudou
        if (cliente.contratos !== newContratosCount || cliente.status !== newStatus) {
          return {
            ...cliente,
            contratos: newContratosCount,
            status: newStatus
          };
        }
        return cliente; // Manter referência se não mudou
      });
      
      
      
      // Só atualizar se algo realmente mudou
      const hasChanges = updatedClientes.some((cliente, index) => cliente !== prev[index]);
      return hasChanges ? updatedClientes : prev;
    });

    // Atualizar métricas dos bancos apenas se houver mudança
    setBancos(prev => {
      const updatedBancos = prev.map(banco => {
        const contratosBank = contratos.filter(c => c.bancoId === banco.id);
        const newContratosCount = contratosBank.length;
        const newVolumeTotal = contratosBank.reduce((sum, c) => sum + c.valorTotal, 0);
        const newVolumeTotalFormatted = newVolumeTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });
        
        // Determinar status automaticamente:
        // - Se tem contratos ativos, é ativo
        // - Se não tem contratos ativos, deve ser inativo
        let newStatus: 'ativo' | 'inativo' = 'inativo'; // Padrão é inativo
        
        // Se tem contratos ativos, deve ser ativo
        const hasContratosAtivos = contratosBank.some(c => c.status === 'ativo');
        if (hasContratosAtivos) {
          newStatus = 'ativo';
        }
        // Se não tem contratos ativos, mantém como inativo
        
        // Só retornar novo objeto se realmente mudou
        if (banco.contratos !== newContratosCount || 
            banco.volumeTotal !== newVolumeTotalFormatted ||
            banco.status !== newStatus) {
          return {
            ...banco,
            contratos: newContratosCount,
            volumeTotal: newVolumeTotalFormatted,
            status: newStatus
          };
        }
        return banco; // Manter referência se não mudou
      });
      
      // Só atualizar se algo realmente mudou
      const hasChanges = updatedBancos.some((banco, index) => banco !== prev[index]);
      return hasChanges ? updatedBancos : prev;
    });
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
      handleSupabaseError(error, 'adicionar cliente');
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
      handleSupabaseError(error, 'atualizar cliente');
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
      handleSupabaseError(error, 'deletar cliente');
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
      await loadContratos(); // Recarregar contratos para atualizar status automaticamente
      return true;
    } catch (error) {
      handleSupabaseError(error, 'adicionar banco');
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
      await loadContratos(); // Recarregar contratos para atualizar métricas automaticamente
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
    console.log('Adicionando contrato:', contratoData);
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);
    
    console.log(' Tentando criar contrato com dados:', contratoData);

    try {
      // Remover campos de PDF dos dados do contrato antes de enviar para o banco
      const { pdfUrl, pdfName, ...contratoDataWithoutPdf } = contratoData as any;

      const contratoInsert: ContratoInsert = {
        cliente_id: contratoDataWithoutPdf.clienteId,
        banco_id: contratoDataWithoutPdf.bancoId,
        tipo_contrato: contratoDataWithoutPdf.tipoContrato,
        data_emprestimo: contratoDataWithoutPdf.dataEmprestimo,
        valor_total: contratoDataWithoutPdf.valorTotal,
        parcelas: contratoDataWithoutPdf.parcelas,
        taxa: contratoDataWithoutPdf.taxa,
        observacoes: contratoDataWithoutPdf.observacoes,
        user_id: user.id,
        // Novos campos
        primeiro_vencimento: contratoDataWithoutPdf.primeiroVencimento || '',
        valor_operacao: contratoDataWithoutPdf.valorOperacao || 0,
        valor_solicitado: contratoDataWithoutPdf.valorSolicitado || 0,
        valor_prestacao: contratoDataWithoutPdf.valorPrestacao || 0
        // Removemos os campos de PDF pois eles não devem ser definidos na criação
      };

      const { error } = await supabase
        .from('contratos')
        .insert([contratoInsert]);

      if (error) throw error;

      await loadContratos();
      return true;
    } catch (error) {
      handleSupabaseError(error, 'adicionar contrato');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateContrato = async (id: string, contratoData: Partial<Contrato>): Promise<boolean> => {
    console.log('Atualizando contrato:', id, contratoData);
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      // Remover campos de PDF dos dados do contrato antes de enviar para o banco
      const { pdfUrl, pdfName, ...contratoDataWithoutPdf } = contratoData as any;
      
      const updateData: any = {};
      if (contratoDataWithoutPdf.clienteId) updateData.cliente_id = contratoDataWithoutPdf.clienteId;
      if (contratoDataWithoutPdf.bancoId) updateData.banco_id = contratoDataWithoutPdf.bancoId;
      if (contratoDataWithoutPdf.tipoContrato) updateData.tipo_contrato = contratoDataWithoutPdf.tipoContrato;
      if (contratoDataWithoutPdf.dataEmprestimo) updateData.data_emprestimo = contratoDataWithoutPdf.dataEmprestimo;
      if (contratoDataWithoutPdf.valorTotal !== undefined) updateData.valor_total = contratoDataWithoutPdf.valorTotal;
      if (contratoDataWithoutPdf.parcelas !== undefined) updateData.parcelas = contratoDataWithoutPdf.parcelas;
      if (contratoDataWithoutPdf.taxa !== undefined) updateData.taxa = contratoDataWithoutPdf.taxa;
      if (contratoDataWithoutPdf.status) updateData.status = contratoDataWithoutPdf.status;
      if (contratoDataWithoutPdf.observacoes !== undefined) updateData.observacoes = contratoDataWithoutPdf.observacoes;
      // Novos campos
      if (contratoDataWithoutPdf.primeiroVencimento !== undefined) updateData.primeiro_vencimento = contratoDataWithoutPdf.primeiroVencimento;
      if (contratoDataWithoutPdf.valorOperacao !== undefined) updateData.valor_operacao = contratoDataWithoutPdf.valorOperacao;
      if (contratoDataWithoutPdf.valorSolicitado !== undefined) updateData.valor_solicitado = contratoDataWithoutPdf.valorSolicitado;
      if (contratoDataWithoutPdf.valorPrestacao !== undefined) updateData.valor_prestacao = contratoDataWithoutPdf.valorPrestacao;
      // Campos para PDF (não atualizamos esses campos aqui, eles são atualizados separadamente)
      // if (contratoDataWithoutPdf.pdfUrl !== undefined) updateData.pdf_url = contratoDataWithoutPdf.pdfUrl;
      // if (contratoDataWithoutPdf.pdfName !== undefined) updateData.pdf_name = contratoDataWithoutPdf.pdfName;

      const { error } = await supabase
        .from('contratos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await loadContratos();
      return true;
    } catch (error) {
      handleSupabaseError(error, 'atualizar contrato');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar se o bucket existe
  const checkStorageBucket = async (): Promise<boolean> => {
    try {
      if (!supabase.storage) {
        throw new Error('Serviço de storage não disponível');
      }
      
      // Verificar se o usuário está autenticado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        throw new Error('Erro de autenticação. Por favor, faça login novamente.');
      }
      
      if (!session) {
        console.error('Usuário não autenticado');
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      console.log('Usuário autenticado:', session.user.id);
      
      console.log('Listando buckets disponíveis...');
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Erro ao listar buckets:', error);
        // Verificar se é um erro de permissão
        if (error.message?.includes('permission')) {
          throw new Error('Permissão negada. Verifique as políticas de acesso ao bucket no painel do Supabase.');
        }
        return false;
      }
      
      console.log('Buckets encontrados:', buckets);
      
      // Verificar se temos buckets
      if (!buckets) {
        console.log('Nenhum bucket retornado');
        return false;
      }
      
      // Verificar se é um array
      if (!Array.isArray(buckets)) {
        console.log('Buckets não é um array:', typeof buckets, buckets);
        return false;
      }
      
      const bucketExists = buckets.some(bucket => {
        console.log(`Verificando bucket: ${bucket.name} (id: ${bucket.id})`);
        return bucket.name === 'contratos-pdfs';
      });
      
      console.log('Bucket "contratos-pdfs" encontrado:', bucketExists);
      
      if (!bucketExists) {
        console.log('Lista de todos os buckets disponíveis:');
        buckets.forEach(bucket => {
          console.log(`- ${bucket.name} (id: ${bucket.id}, public: ${bucket.public})`);
        });
      }
      
      return bucketExists;
    } catch (error) {
      console.error('Erro ao verificar bucket:', error);
      return false;
    }
  };

  // Função para upload de PDF do contrato
  const uploadContratoPdf = async (contratoId: string, file: File | null): Promise<boolean> => {
    console.log('Iniciando upload de PDF para contrato:', contratoId, file?.name);
    
    // Verificar autenticação do usuário
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Erro ao verificar sessão:', sessionError);
      setError('Erro de autenticação. Por favor, faça login novamente.');
      return false;
    }
    
    if (!session) {
      console.error('Usuário não autenticado');
      setError('Usuário não autenticado. Faça login novamente.');
      return false;
    }
    
    console.log('Usuário autenticado:', session.user);
    
    if (!user) {
      console.error('Contexto de usuário não disponível');
      setError('Contexto de usuário não disponível. Faça login novamente.');
      return false;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Verificar se o serviço de storage está disponível
      if (!supabase.storage) {
        throw new Error('Serviço de storage não disponível. Verifique a configuração do Supabase.');
      }

      if (file) {
        // Fazer upload do arquivo para o storage do Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${contratoId}.${fileExt}`;
        
        console.log('Tentando upload do arquivo:', fileName);
        
        // Verificar se o bucket existe
        console.log('Verificando existência do bucket...');
        const bucketExists = await checkStorageBucket();
        console.log('Resultado da verificação do bucket:', bucketExists);
        
        if (!bucketExists) {
          // Tentativa alternativa de verificar o bucket
          console.log('Tentando verificar bucket com método alternativo...');
          try {
            const { data: testData, error: testError } = await supabase.storage.from('contratos-pdfs').list('', { limit: 1 });
            if (testError) {
              console.error('Erro ao testar acesso ao bucket:', testError);
              if (testError.message?.includes('Bucket not found')) {
                throw new Error('Bucket "contratos-pdfs" não encontrado. Por favor, configure o storage no painel do Supabase conforme instruções em SUPABASE_STORAGE_SETUP.md.');
              } else {
                throw new Error(`Erro ao acessar bucket: ${testError.message}`);
              }
            } else {
              console.log('Teste de acesso ao bucket bem-sucedido');
            }
          } catch (testError) {
            console.error('Erro no teste alternativo:', testError);
            throw new Error('Bucket "contratos-pdfs" não encontrado. Por favor, configure o storage no painel do Supabase conforme instruções em SUPABASE_STORAGE_SETUP.md.');
          }
        }
        
        const { error: uploadError } = await supabase.storage
          .from('contratos-pdfs')
          .upload(fileName, file, {
            upsert: true
          });

        if (uploadError) {
          console.error('Erro no upload do PDF:', uploadError);
          // Tratar erros específicos
          if (uploadError.message?.includes('Bucket not found')) {
            throw new Error('Bucket "contratos-pdfs" não encontrado. Por favor, configure o storage no painel do Supabase conforme instruções em SUPABASE_STORAGE_SETUP.md.');
          } else if (uploadError.message?.includes('Permission denied')) {
            throw new Error('Permissão negada. Verifique as políticas de acesso ao bucket no painel do Supabase.');
          } else if (uploadError.message?.includes('Requested entity too large')) {
            throw new Error('Arquivo muito grande. O tamanho máximo permitido é 10MB.');
          }
          throw uploadError;
        }

        // Obter URL pública do arquivo
        console.log('Obtendo URL pública para:', fileName);
        const { data: urlData } = supabase.storage
          .from('contratos-pdfs')
          .getPublicUrl(fileName);

        console.log('URL pública obtida:', urlData);

        // Verificar se a URL foi obtida corretamente
        if (!urlData?.publicUrl) {
          throw new Error('Não foi possível obter a URL pública do arquivo.');
        }

        // Atualizar contrato com informações do PDF
        console.log('Atualizando contrato com informações do PDF...');
        const { error: updateError } = await supabase
          .from('contratos')
          .update({
            pdf_url: urlData.publicUrl,
            pdf_name: file.name
          })
          .eq('id', contratoId);

        if (updateError) {
          console.error('Erro ao atualizar contrato com PDF:', updateError);
          throw updateError;
        }
        
        console.log('Contrato atualizado com sucesso');
      } else {
        // Remover PDF do contrato
        console.log('Removendo PDF do contrato...');
        const { error: updateError } = await supabase
          .from('contratos')
          .update({
            pdf_url: null,
            pdf_name: null
          })
          .eq('id', contratoId);

        if (updateError) {
          console.error('Erro ao remover PDF do contrato:', updateError);
          throw updateError;
        }
        
        console.log('PDF removido com sucesso');
      }

      // Em vez de recarregar todos os contratos, vamos atualizar apenas o contrato específico
      // await loadContratos();
      // Atualizar apenas o contrato modificado
      await updateSingleContrato(contratoId);
      return true;
    } catch (error: any) {
      console.error('Erro detalhado no upload de PDF:', error);
      handleSupabaseError(error, file ? 'fazer upload do PDF do contrato' : 'remover PDF do contrato');
      
      // Mostrar mensagem mais específica de erro
      if (error.message) {
        setError(error.message);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar um único contrato após mudanças no PDF
  const updateSingleContrato = async (contratoId: string) => {
    console.log('Atualizando contrato individual:', contratoId);
    try {
      const { data, error } = await supabase
        .from('contratos')
        .select(`
          *,
          clientes!contratos_cliente_id_fkey(nome),
          bancos!contratos_banco_id_fkey(nome)
        `)
        .eq('id', contratoId)
        .single();

      if (error) throw error;

      if (data) {
        const contratoFormatted: Contrato = {
          id: data.id,
          clienteId: data.cliente_id,
          clienteNome: (data.clientes as any)?.nome || 'Cliente não encontrado',
          bancoId: data.banco_id,
          bancoNome: (data.bancos as any)?.nome || 'Banco não encontrado',
          tipoContrato: data.tipo_contrato,
          dataEmprestimo: data.data_emprestimo,
          valorTotal: data.valor_total,
          parcelas: data.parcelas,
          valorParcela: (data.valor_total / data.parcelas).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
          }),
          taxa: data.taxa,
          receitaAgente: (data.valor_total * (data.taxa / 100)).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
          }),
          status: data.status,
          observacoes: data.observacoes,
          // Novos campos
          primeiroVencimento: data.primeiro_vencimento,
          valorOperacao: data.valor_operacao,
          valorSolicitado: data.valor_solicitado,
          valorPrestacao: data.valor_prestacao,
          // Campos para PDF
          pdfUrl: data.pdf_url,
          pdfName: data.pdf_name
        };

        // Atualizar o contrato específico no estado
        setContratos(prev => {
          // Verificar se o contrato já existe no estado
          const contratoExists = prev.some(c => c.id === contratoId);
          
          if (contratoExists) {
            // Se existe, atualizar apenas esse contrato
            console.log('Atualizando contrato existente no estado');
            return prev.map(c => c.id === contratoId ? contratoFormatted : c);
          } else {
            // Se não existe, adicionar o novo contrato
            console.log('Adicionando novo contrato ao estado');
            return [...prev, contratoFormatted];
          }
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar contrato individual:', error);
      // Se falhar, recarregar todos os contratos
      await loadContratos();
    }
  };

  // Função para download do PDF do contrato
  const downloadContratoPdf = async (contratoId: string): Promise<void> => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const contrato = contratos.find(c => c.id === contratoId);
      if (!contrato || !contrato.pdfUrl) {
        throw new Error('PDF não encontrado para este contrato');
      }

      // Criar link para download
      const link = document.createElement('a');
      link.href = contrato.pdfUrl;
      link.target = '_blank';
      link.download = contrato.pdfName || `contrato-${contratoId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      handleSupabaseError(error, 'fazer download do PDF do contrato');
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
    refreshData,
    // Função para upload de PDF
    uploadContratoPdf,
    // Função para download de PDF
    downloadContratoPdf
  };

  return (
    <DataContext.Provider value={{
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
      refreshData,
      uploadContratoPdf,
      downloadContratoPdf
    }}>
      {children}
    </DataContext.Provider>
  );
}
