import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/lib/database.types';

interface User {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  avatar?: string;
}

interface RegisterData {
  nome: string;
  email: string;
  password: string;
  cargo: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Função auxiliar para adicionar timeout a uma Promise
  const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
    let timeoutId: NodeJS.Timeout;
    const timeout = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
  };

  // Verificar sessão do usuário e carregar perfil
  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      try {
        console.log('🔍 Iniciando verificação de sessão...');
        
        // Verificação inicial rápida - tentar localStorage primeiro
        if (!initialCheckDone) {
          try {
            const storedUser = localStorage.getItem('maiacred_user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              console.log('✅ Usuário encontrado no localStorage:', parsedUser.email);
              setUser(parsedUser);
              setIsLoading(false);
              setInitialCheckDone(true);
              return;
            }
          } catch (error) {
            console.warn('⚠️ Erro ao ler localStorage:', error);
          }
          setInitialCheckDone(true);
        }

        // Verificar se o Supabase está configurado
        if (!supabase || typeof supabase.auth?.getSession !== 'function') {
          console.warn('⚠️ Supabase não configurado. Funcionando em modo offline.');
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        console.log('🔄 Verificando sessão no Supabase...');
        
        let sessionResult: any;
        let attempt = 0;
        const maxAttempts = 3;
        const sessionTimeoutMs = 30000; // 30 segundos para a verificação de sessão

        while (attempt < maxAttempts) {
          try {
            sessionResult = await withTimeout(
              supabase.auth.getSession(),
              sessionTimeoutMs,
              'Timeout na verificação de sessão do Supabase.'
            );
            break; // Se sucesso, sair do loop
          } catch (error: any) {
            attempt++;
            console.warn(`Tentativa ${attempt} de obter sessão falhou:`, error.message);
            if (attempt >= maxAttempts) {
              throw error; // Se todas as tentativas falharem, lançar o erro
            }
            // Aguardar um pouco antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
        
        if (!sessionResult) {
          throw new Error('Não foi possível obter a sessão');
        }

        const { data: { session }, error } = sessionResult;
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setError(error.message);
          return;
        }

        if (session?.user && isMounted) {
          console.log('✅ Sessão ativa encontrada:', session.user.email);
          
          // Buscar perfil do usuário
          try {
            const { data: profile, error: profileError } = await withTimeout(
              supabase.from('profiles').select('*').eq('id', session.user.id).single(),
              5000, // 5 segundos para carregar o perfil
              'Timeout ao carregar perfil do usuário.'
            );

            if (profileError) {
              console.warn('⚠️ Erro ao buscar perfil:', profileError);
              // Criar usuário básico mesmo sem perfil
              const basicUser: User = {
                id: session.user.id,
                nome: session.user.email?.split('@')[0] || 'Usuário',
                email: session.user.email || '',
                cargo: 'Usuário'
              };
              setUser(basicUser);
              localStorage.setItem('maiacred_user', JSON.stringify(basicUser));
            } else {
              const userData: User = {
                id: profile.id,
                nome: profile.nome || session.user.email?.split('@')[0] || 'Usuário',
                email: profile.email || session.user.email || '',
                cargo: profile.cargo || 'Usuário',
                avatar: profile.avatar_url
              };
              setUser(userData);
              localStorage.setItem('maiacred_user', JSON.stringify(userData));
              console.log('✅ Perfil carregado:', userData.nome);
            }
          } catch (profileError: any) {
            console.error('❌ Erro ao buscar perfil:', profileError.message);
            // Fallback para usuário básico
            const basicUser: User = {
              id: session.user.id,
              nome: session.user.email?.split('@')[0] || 'Usuário',
              email: session.user.email || '',
              cargo: 'Usuário'
            };
            setUser(basicUser);
            localStorage.setItem('maiacred_user', JSON.stringify(basicUser));
          }
        } else {
          console.log('ℹ️ Nenhuma sessão ativa encontrada');
          localStorage.removeItem('maiacred_user');
        }

        if (isMounted) {
          setIsLoading(false);
        }
        
      } catch (error: any) {
        console.error('❌ Erro crítico na verificação de sessão:', error.message);
        if (isMounted) {
          setError(error.message);
          setIsLoading(false);
          // Limpar dados em caso de erro
          localStorage.removeItem('maiacred_user');
        }
      }
    };

    // Executar verificação
    getSession();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Carregando perfil do usuário:', userId);
      
      // Criar perfil básico IMEDIATAMENTE sem aguardar nenhuma chamada async
      const basicUserData = {
        id: userId,
        nome: 'Usuário',
        email: '',
        cargo: 'Usuário',
        avatar: undefined
      };
      
      console.log('✅ Definindo usuário IMEDIATAMENTE:', basicUserData);
      setUser(basicUserData);
      
      // Salvar no localStorage
      try {
        localStorage.setItem('maiacred_user', JSON.stringify(basicUserData));
        console.log('✅ Dados salvos no localStorage');
      } catch (error) {
        console.warn('Erro ao salvar no localStorage:', error);
      }
      
      // Tentar melhorar os dados em background SEM bloquear
      setTimeout(async () => {
        try {
          console.log('🔄 Tentando carregar dados do usuário em background...');
          
          const { data: { user } } = await withTimeout(
            supabase.auth.getUser(),
            5000, // 5 segundos para getUser
            'Timeout ao obter dados do usuário em background.'
          );
          
          if (user && user.email) {
            const improvedUserData = {
              id: user.id,
              nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
              email: user.email,
              cargo: user.user_metadata?.cargo || 'Usuário',
              avatar: user.user_metadata?.avatar || undefined
            };
            
            console.log('✅ Dados melhorados obtidos:', improvedUserData);
            setUser(improvedUserData);
            localStorage.setItem('maiacred_user', JSON.stringify(improvedUserData));
          }
        } catch (userError: any) {
          console.log('⚠️ Não foi possível melhorar dados do usuário:', userError.message);
        }
        
        // Tentar carregar perfil da tabela profiles
        try {
          console.log('🔄 Tentando carregar perfil da tabela...');
          
          const { data: profile, error } = await withTimeout(
            supabase.from('profiles').select('*').eq('id', userId).single(),
            5000, // 5 segundos para carregar perfil da tabela
            'Timeout ao carregar perfil da tabela.'
          );

          if (!error && profile) {
            const completeUserData = {
              id: profile.id,
              nome: profile.nome,
              email: profile.email,
              cargo: profile.cargo,
              avatar: profile.avatar_url || undefined
            };
            
            console.log('✅ Perfil completo carregado:', completeUserData);
            setUser(completeUserData);
            localStorage.setItem('maiacred_user', JSON.stringify(completeUserData));
          }
        } catch (profileError: any) {
          console.log('⚠️ Perfil da tabela não disponível:', profileError.message);
        }
      }, 100); // Executar após 100ms
      
    } catch (error: any) {
      console.error('Erro crítico ao carregar perfil:', error.message);
      
      // Mesmo com erro, garantir que o usuário seja definido
      const emergencyUserData = {
        id: userId,
        nome: 'Usuário',
        email: '',
        cargo: 'Usuário',
        avatar: undefined
      };
      
      console.log('🚨 Usando dados de emergência:', emergencyUserData);
      setUser(emergencyUserData);
      
      try {
        localStorage.setItem('maiacred_user', JSON.stringify(emergencyUserData));
      } catch (storageError) {
        console.warn('Erro ao salvar dados de emergência:', storageError);
      }
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Tentando registrar usuário:', data.email);
      
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              nome: data.nome,
              cargo: data.cargo
            },
            emailRedirectTo: undefined // Desabilita redirecionamento por email
          }
        }),
        15000, // 15 segundos para registro
        'Timeout ao registrar usuário.'
      );

      console.log('Resposta do registro:', { authData, authError });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        
        // Detectar se a feature está desabilitada
        if (authError.message?.includes('disabled') || authError.message?.includes('Email logins')) {
          console.error('🚨 ERRO CRÍTICO: Autenticação por email está DESABILITADA no Supabase!');
          console.error('📋 SOLUÇÃO URGENTE:');
          console.error('   1. Acesse: https://supabase.com/dashboard');
          console.error('   2. Projeto: emvnudlonqoyfptrdwtd');
          console.error('   3. Authentication → Settings');
          console.error('   4. HABILITE: "Enable email provider"');
          console.error('   5. DESABILITE: "Confirm email" (para desenvolvimento)');
          console.error('   6. Site URL: http://localhost:8080');
          setError('CONFIGURAÇÃO NECESSÁRIA: A autenticação por email está desabilitada no Supabase. Verifique o console (F12) para instruções detalhadas.');
        } else if (authError.message?.includes('User already registered')) {
          console.warn('⚠️ Usuário já existe no sistema');
          console.log('📋 OPÇÕES:');
          console.log('   1. Faça LOGIN com este email na tela de login');
          console.log('   2. Use um EMAIL DIFERENTE para registro');
          console.log('   3. Delete o usuário no Supabase Dashboard > Authentication > Users');
          setError('Este email já está cadastrado. Tente fazer login ou use um email diferente.');
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return false;
      }

      if (authData.user) {
        console.log('Usuário criado:', authData.user);
        
        // Verificar se o usuário foi confirmado automaticamente
        if (authData.user.email_confirmed_at) {
          console.log('Usuário confirmado automaticamente');
          try {
            await loadUserProfile(authData.user.id);
          } catch (profileError) {
            console.error('Erro no carregamento do perfil após registro:', profileError);
          }
        } else {
          console.log('Usuário criado mas não confirmado. Fazendo login direto...');
          // Se não foi confirmado, mas existe, tentar fazer login direto
          // Isso é útil se a confirmação de email estiver desabilitada
          const loginResult = await login(data.email, data.password);
          if (loginResult) {
            setIsLoading(false);
            return true;
          }
        }
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('Erro no registro:', error.message);
      setError(error.message || 'Erro inesperado durante o registro');
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Tentando fazer login com:', email);
      
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        }),
        15000, // 15 segundos para login
        'Timeout ao fazer login.'
      );

      console.log('Resposta do login:', { authData, authError });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        
        // Mensagens de erro mais específicas
        let errorMessage = authError.message;
        
        switch (authError.message) {
          case 'Invalid login credentials':
            errorMessage = 'Email ou senha incorretos';
            break;
          case 'Email not confirmed':
            errorMessage = 'Email não confirmado. Você precisa confirmar o usuário no painel do Supabase: Authentication > Users > Confirmar usuário.';
            break;
          case 'Too many requests':
            errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
            break;
          case 'User not found':
            errorMessage = 'Usuário não encontrado';
            break;
          default:
            // Detectar se a feature está desabilitada
            if (authError.message?.includes('disabled') || authError.message?.includes('Email logins')) {
              console.error('🚨 ERRO CRÍTICO: Autenticação por email está DESABILITADA no Supabase!');
              console.error('📋 SOLUÇÃO URGENTE:');
              console.error('   1. Acesse: https://supabase.com/dashboard');
              console.error('   2. Projeto: emvnudlonqoyfptrdwtd');
              console.error('   3. Authentication → Settings');
              console.error('   4. HABILITE: "Enable email provider"');
              console.error('   5. DESABILITE: "Confirm email" (para desenvolvimento)');
              console.error('   6. Site URL: http://localhost:8080');
              errorMessage = 'CONFIGURAÇÃO NECESSÁRIA: A autenticação por email está desabilitada no Supabase. Verifique o console (F12) para instruções detalhadas.';
            } else {
              errorMessage = `Erro de login: ${authError.message}`;
            }
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return false;
      }

      if (authData.user) {
        console.log('Login bem-sucedido. Criando usuário com dados do login...');
        
        // Criar usuário IMEDIATAMENTE com dados do login
        const loginUserData = {
          id: authData.user.id,
          nome: authData.user.user_metadata?.nome || authData.user.email?.split('@')[0] || 'Usuário',
          email: authData.user.email || email,
          cargo: authData.user.user_metadata?.cargo || 'Usuário',
          avatar: authData.user.user_metadata?.avatar || undefined
        };
        
        console.log('✅ Definindo usuário com dados do login:', loginUserData);
        setUser(loginUserData);
        
        // Salvar no localStorage
        try {
          localStorage.setItem('maiacred_user', JSON.stringify(loginUserData));
          console.log('✅ Dados do login salvos no localStorage');
        } catch (error) {
          console.warn('Erro ao salvar dados do login no localStorage:', error);
        }
        
        // Tentar melhorar dados em background (sem bloquear)
        setTimeout(async () => {
          try {
            console.log('🔄 Tentando carregar perfil completo da tabela em background...');
            
            const { data: profile, error } = await withTimeout(
              supabase.from('profiles').select('*').eq('id', authData.user.id).single(),
              5000, // 5 segundos para background
              'Timeout ao carregar perfil em background.'
            );

            if (!error && profile) {
              const completeUserData = {
                id: profile.id,
                nome: profile.nome || loginUserData.nome,
                email: profile.email || loginUserData.email,
                cargo: profile.cargo || loginUserData.cargo,
                avatar: profile.avatar_url || undefined
              };
              
              console.log('✅ Perfil completo carregado em background:', completeUserData);
              setUser(completeUserData);
              localStorage.setItem('maiacred_user', JSON.stringify(completeUserData));
            } else {
              console.log('⚠️ Perfil da tabela não disponível, mantendo dados do login');
            }
          } catch (profileError: any) {
            console.log('⚠️ Erro no carregamento do perfil em background, mantendo dados do login:', profileError.message);
          }
        }, 200); // Executar após 200ms
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('Erro no login:', error.message);
      setError(error.message || 'Erro inesperado durante o login');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Limpar estado imediatamente, independente da resposta do Supabase
      setUser(null);
      
      // Limpar localStorage imediatamente
      try {
        localStorage.removeItem('maiacred_user');
        console.log('✓ Dados locais limpos com sucesso');
      } catch (error) {
        console.warn('Erro ao limpar localStorage:', error);
      }
      
      // Tentar fazer logout no Supabase com timeout menor
      try {
        const { error } = await withTimeout(
          supabase.auth.signOut(),
          3000, // Timeout de apenas 3 segundos
          'Timeout no logout do Supabase.'
        );
        
        if (error) {
          console.warn('Aviso no logout do Supabase:', error.message);
          // Não definir como erro crítico, pois dados locais já foram limpos
        } else {
          console.log('✓ Logout do Supabase realizado com sucesso');
        }
      } catch (timeoutError: any) {
        console.warn('⚠️ Timeout no logout do Supabase, mas dados locais foram limpos:', timeoutError.message);
        // Continuar normalmente, dados locais já foram limpos
      }
      
    } catch (error: any) {
      console.error('Erro no logout:', error.message);
      // Mesmo com erro, garantir que usuário seja deslogado localmente
      setUser(null);
      try {
        localStorage.removeItem('maiacred_user');
      } catch (storageError) {
        console.warn('Erro ao limpar localStorage no catch:', storageError);
      }
      setError('Logout realizado localmente. Pode haver problemas de conectividade.');
    } finally {
      setIsLoading(false);
      console.log('🔓 Logout finalizado - usuário desconectado');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}