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
        // Timeout de 5 segundos para verificação de sessão
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Timeout na verificação de sessão'));
          }, 5000);
        });

        // Verificação inicial rápida - tentar localStorage primeiro
        if (!initialCheckDone) {
          try {
            const storedUser = localStorage.getItem('maiacred_user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              setIsLoading(false);
              setInitialCheckDone(true);
              // Verificar sessão em background
              setTimeout(() => getSession(), 100);
              return;
            }
          } catch (error) {
            console.warn('Erro ao ler localStorage:', error);
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

        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setError(error.message);
          return;
        }

        if (session?.user && isMounted) {
          await loadUserProfile(session.user.id);
        } else if (isMounted) {
          // Se não há sessão ativa, limpar dados locais
          localStorage.removeItem('maiacred_user');
          setUser(null);
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('Erro ao verificar sessão:', error);
        
        if (error.message === 'Timeout na verificação de sessão') {
          console.warn('⚠️ Timeout na verificação de autenticação. Continuando em modo offline...');
          setError('Problemas de conectividade. Tente recarregar a página.');
        } else {
          console.warn('Continuando em modo offline...');
          setError(null); // Não mostrar erro se for problema de configuração
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getSession();

    // Escutar mudanças na autenticação apenas se Supabase estiver configurado
    let subscription: any = null;
    
    try {
      if (supabase && typeof supabase.auth?.onAuthStateChange === 'function') {
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;

            if (event === 'SIGNED_IN' && session?.user) {
              await loadUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
            }
            
            setIsLoading(false);
          }
        );
        subscription = data.subscription;
      }
    } catch (error) {
      console.error('Erro ao configurar listener de autenticação:', error);
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Carregando perfil do usuário:', userId);
      
      // Timeout de 8 segundos para carregamento do perfil
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout no carregamento do perfil'));
        }, 8000);
      });

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: profile, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      console.log('Perfil carregado:', { profile, error });

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        
        // Se o perfil não existir ou houver problemas, criar um perfil básico
        if (error.code === 'PGRST116' || error.message?.includes('Timeout')) {
          console.warn('Perfil não encontrado ou timeout. Criando perfil básico...');
          
          // Tentar obter dados do usuário autenticado
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const basicUserData = {
              id: user.id,
              nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
              email: user.email || '',
              cargo: user.user_metadata?.cargo || 'Usuário',
              avatar: user.user_metadata?.avatar || undefined
            };
            
            console.log('Usando perfil básico:', basicUserData);
            setUser(basicUserData);
            
            // Salvar no localStorage
            try {
              localStorage.setItem('maiacred_user', JSON.stringify(basicUserData));
            } catch (error) {
              console.warn('Erro ao salvar no localStorage:', error);
            }
            
            return;
          }
        }
        
        // Se não conseguir criar perfil básico, mostrar erro mas não bloquear
        console.warn('Não foi possível carregar perfil, continuando sem dados de perfil');
        setError(null); // Não mostrar erro que impeça o uso
        return;
      }

      if (profile) {
        console.log('Definindo usuário no estado:', profile);
        const userData = {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          cargo: profile.cargo,
          avatar: profile.avatar_url || undefined
        };
        
        setUser(userData);
        
        // Salvar no localStorage para acesso rápido
        try {
          localStorage.setItem('maiacred_user', JSON.stringify(userData));
        } catch (error) {
          console.warn('Erro ao salvar no localStorage:', error);
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      
      // Em qualquer erro, tentar criar um perfil básico para não bloquear o usuário
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const fallbackUserData = {
            id: user.id,
            nome: user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            cargo: 'Usuário',
            avatar: undefined
          };
          
          console.log('Usando perfil fallback:', fallbackUserData);
          setUser(fallbackUserData);
          
          try {
            localStorage.setItem('maiacred_user', JSON.stringify(fallbackUserData));
          } catch (storageError) {
            console.warn('Erro ao salvar fallback no localStorage:', storageError);
          }
        }
      } catch (fallbackError) {
        console.error('Erro ao criar perfil fallback:', fallbackError);
        setError('Problemas de conectividade. Algumas funcionalidades podem estar limitadas.');
      }
    }
  };



  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Tentando registrar usuário:', data.email);
      
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

      console.log('Resposta do registro:', { authData, authError });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        setError(authError.message);
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
      console.log('Tentando fazer login com:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

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
            errorMessage = `Erro de login: ${authError.message}`;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return false;
      }

      if (authData.user) {
        console.log('Login bem-sucedido. Carregando perfil...');
        try {
          await loadUserProfile(authData.user.id);
        } catch (profileError) {
          console.error('Erro no carregamento do perfil, mas login foi bem-sucedido:', profileError);
          // Não bloquear o login se houver erro no perfil
        } finally {
          setIsLoading(false);
        }
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
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error);
        setError(error.message);
      }
      
      setUser(null);
      
      // Limpar localStorage
      try {
        localStorage.removeItem('maiacred_user');
      } catch (error) {
        console.warn('Erro ao limpar localStorage:', error);
      }
    } catch (error) {
      console.error('Erro no logout:', error);
      setError('Erro inesperado durante o logout');
    } finally {
      setIsLoading(false);
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