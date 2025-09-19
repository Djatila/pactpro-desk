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

  // Verificar sessão do usuário e carregar perfil
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const getSession = async () => {
      try {
        // Removido log para evitar loop infinito
        // console.log('🔍 Iniciando verificação de sessão...');
        
        // Timeout aumentado para PCs com conectividade mais lenta (15 segundos)
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Timeout na verificação de sessão'));
          }, 15000); // Aumentado de 10s para 15s para maior tolerância
        });

        // Verificação inicial rápida - tentar localStorage primeiro
        if (!initialCheckDone) {
          try {
            const storedUser = localStorage.getItem('maiacred_user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              // Removido log para evitar loop infinito
              // console.log('✅ Usuário encontrado no localStorage:', parsedUser.email);
              setUser(parsedUser);
              setIsLoading(false);
              setInitialCheckDone(true);
              // Verificar sessão em background após um curto delay
              // Removido para evitar loop infinito
              // setTimeout(() => {
              //   if (isMounted) {
              //     getSession();
              //   }
              // }, 500);
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

        // Removido log para evitar loop infinito
        // console.log('🔄 Verificando sessão no Supabase...');
        
        // Tentar obter a sessão com múltiplas tentativas em caso de falha
        let sessionResult;
        let attempt = 0;
        const maxAttempts = 3;
        
        while (attempt < maxAttempts) {
          try {
            const sessionPromise = supabase.auth.getSession();
            sessionResult = await Promise.race([
              sessionPromise,
              timeoutPromise
            ]);
            break; // Se sucesso, sair do loop
          } catch (error) {
            attempt++;
            console.warn(`Tentativa ${attempt} de obter sessão falhou:`, error);
            if (attempt >= maxAttempts) {
              throw error; // Se todas as tentativas falharem, lançar o erro
            }
            // Aguardar um pouco antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }

        clearTimeout(timeoutId);
        
        if (!sessionResult) {
          throw new Error('Não foi possível obter a sessão');
        }

        const { data: { session }, error } = sessionResult as any;
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setError(error.message);
          return;
        }

        if (session?.user && isMounted) {
          // Removido log para evitar loop infinito
          // console.log('✅ Sessão ativa encontrada:', session.user.email);
          
          // Buscar perfil do usuário
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

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
                avatar: profile.avatar
              };
              setUser(userData);
              localStorage.setItem('maiacred_user', JSON.stringify(userData));
              // Removido log para evitar loop infinito
              // console.log('✅ Perfil carregado:', userData.nome);
            }
          } catch (profileError) {
            console.error('❌ Erro ao buscar perfil:', profileError);
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
          // Removido log para evitar loop infinito
          // console.log('ℹ️ Nenhuma sessão ativa encontrada');
          localStorage.removeItem('maiacred_user');
        }

        if (isMounted) {
          setIsLoading(false);
        }
        
      } catch (error) {
        console.error('❌ Erro crítico na verificação de sessão:', error);
        if (isMounted) {
          setError('Erro na verificação de autenticação');
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
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // Removido log para evitar loop infinito
      // console.log('Carregando perfil do usuário:', userId);
      
      // Criar perfil básico IMEDIATAMENTE sem aguardar nenhuma chamada async
      const basicUserData = {
        id: userId,
        nome: 'Usuário',
        email: '',
        cargo: 'Usuário',
        avatar: undefined
      };
      
      // Removido log para evitar loop infinito
      // console.log('✅ Definindo usuário IMEDIATAMENTE:', basicUserData);
      setUser(basicUserData);
      
      // Salvar no localStorage
      try {
        localStorage.setItem('maiacred_user', JSON.stringify(basicUserData));
        // Removido log para evitar loop infinito
        // console.log('✅ Dados salvos no localStorage');
      } catch (error) {
        console.warn('Erro ao salvar no localStorage:', error);
      }
      
      // Tentar melhorar os dados em background SEM bloquear
      setTimeout(async () => {
        try {
          // Removido log para evitar loop infinito
          // console.log('🔄 Tentando carregar dados do usuário em background...');
          
          // Timeout muito agressivo para getUser
          const getUserPromise = supabase.auth.getUser();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Timeout getUser'));
            }, 2000); // 2 segundos
          });
          
          const { data: { user } } = await Promise.race([
            getUserPromise,
            timeoutPromise
          ]) as any;
          
          if (user && user.email) {
            const improvedUserData = {
              id: user.id,
              nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
              email: user.email,
              cargo: user.user_metadata?.cargo || 'Usuário',
              avatar: user.user_metadata?.avatar || undefined
            };
            
            // Removido log para evitar loop infinito
            // console.log('✅ Dados melhorados obtidos:', improvedUserData);
            setUser(improvedUserData);
            localStorage.setItem('maiacred_user', JSON.stringify(improvedUserData));
          }
        } catch (userError) {
          // Removido log para evitar loop infinito
          // console.log('⚠️ Não foi possível melhorar dados do usuário:', userError);
        }
        
        // Tentar carregar perfil da tabela profiles
        try {
          // Removido log para evitar loop infinito
          // console.log('🔄 Tentando carregar perfil da tabela...');
          
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Timeout profile'));
            }, 2000); // 2 segundos
          });

          const { data: profile, error } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]) as any;

          if (!error && profile) {
            const completeUserData = {
              id: profile.id,
              nome: profile.nome,
              email: profile.email,
              cargo: profile.cargo,
              avatar: profile.avatar_url || undefined
            };
            
            // Removido log para evitar loop infinito
            // console.log('✅ Perfil completo carregado:', completeUserData);
            setUser(completeUserData);
            localStorage.setItem('maiacred_user', JSON.stringify(completeUserData));
          }
        } catch (profileError) {
          // Removido log para evitar loop infinito
          // console.log('⚠️ Perfil da tabela não disponível:', profileError);
        }
      }, 100); // Executar após 100ms
      
    } catch (error: any) {
      console.error('Erro crítico ao carregar perfil:', error);
      
      // Mesmo com erro, garantir que o usuário seja definido
      const emergencyUserData = {
        id: userId,
        nome: 'Usuário',
        email: '',
        cargo: 'Usuário',
        avatar: undefined
      };
      
      // Removido log para evitar loop infinito
      // console.log('🚨 Usando dados de emergência:', emergencyUserData);
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
      // Removido log para evitar loop infinito
      // console.log('Tentando registrar usuário:', data.email);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome: data.nome,
            cargo: data.cargo
          },
          emailRedirectTo: undefined // Desabilita redirecionamento por email
        }
      });

      // Removido log para evitar loop infinito
      // console.log('Resposta do registro:', { authData, authError });

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
        // Removido log para evitar loop infinito
        // console.log('Usuário criado:', authData.user);
        
        // Verificar se o usuário foi confirmado automaticamente
        if (authData.user.email_confirmed_at) {
          // Removido log para evitar loop infinito
          // console.log('Usuário confirmado automaticamente');
          try {
            await loadUserProfile(authData.user.id);
          } catch (profileError) {
            console.error('Erro no carregamento do perfil após registro:', profileError);
          }
        } else {
          // Removido log para evitar loop infinito
          // console.log('Usuário criado mas não confirmado. Fazendo login direto...');
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
    } catch (error) {
      console.error('Erro no registro:', error);
      setError('Erro inesperado durante o registro');
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Removido log para evitar loop infinito
      // console.log('Tentando fazer login com:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      // Removido log para evitar loop infinito
      // console.log('Resposta do login:', { authData, authError });

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
        // Removido log para evitar loop infinito
        // console.log('Login bem-sucedido. Criando usuário com dados do login...');
        
        // Criar usuário IMEDIATAMENTE com dados do login
        const loginUserData = {
          id: authData.user.id,
          nome: authData.user.user_metadata?.nome || authData.user.email?.split('@')[0] || 'Usuário',
          email: authData.user.email || email,
          cargo: authData.user.user_metadata?.cargo || 'Usuário',
          avatar: authData.user.user_metadata?.avatar || undefined
        };
        
        // Removido log para evitar loop infinito
        // console.log('✅ Definindo usuário com dados do login:', loginUserData);
        setUser(loginUserData);
        
        // Salvar no localStorage
        try {
          localStorage.setItem('maiacred_user', JSON.stringify(loginUserData));
          // Removido log para evitar loop infinito
          // console.log('✅ Dados do login salvos no localStorage');
        } catch (error) {
          console.warn('Erro ao salvar dados do login no localStorage:', error);
        }
        
        // Tentar melhorar dados em background (sem bloquear)
        setTimeout(async () => {
          try {
            // Removido log para evitar loop infinito
            // console.log('🔄 Tentando carregar perfil completo da tabela em background...');
            
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single();
              
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error('Timeout profile background'));
              }, 3000); // 3 segundos para background
            });

            const { data: profile, error } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any;

            if (!error && profile) {
              const completeUserData = {
                id: profile.id,
                nome: profile.nome || loginUserData.nome,
                email: profile.email || loginUserData.email,
                cargo: profile.cargo || loginUserData.cargo,
                avatar: profile.avatar_url || undefined
              };
              
              // Removido log para evitar loop infinito
              // console.log('✅ Perfil completo carregado em background:', completeUserData);
              setUser(completeUserData);
              localStorage.setItem('maiacred_user', JSON.stringify(completeUserData));
            } else {
              // Removido log para evitar loop infinito
              // console.log('⚠️ Perfil da tabela não disponível, mantendo dados do login');
            }
          } catch (profileError) {
            // Removido log para evitar loop infinito
            // console.log('⚠️ Erro no carregamento do perfil em background, mantendo dados do login:', profileError);
          }
        }, 200); // Executar após 200ms
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro inesperado durante o login');
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
        // Removido log para evitar loop infinito
        // console.log('✓ Dados locais limpos com sucesso');
      } catch (error) {
        console.warn('Erro ao limpar localStorage:', error);
      }
      
      // Tentar fazer logout no Supabase com timeout menor
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout no logout'));
        }, 3000); // Timeout de apenas 3 segundos
      });
      
      try {
        const { error } = await Promise.race([
          logoutPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          console.warn('Aviso no logout do Supabase:', error.message);
          // Não definir como erro crítico, pois dados locais já foram limpos
        } else {
          // Removido log para evitar loop infinito
          // console.log('✓ Logout do Supabase realizado com sucesso');
        }
      } catch (timeoutError) {
        console.warn('⚠️ Timeout no logout do Supabase, mas dados locais foram limpos');
        // Continuar normalmente, dados locais já foram limpos
      }
      
    } catch (error) {
      console.error('Erro no logout:', error);
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
      // Removido log para evitar loop infinito
      // console.log('🔓 Logout finalizado - usuário desconectado');
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