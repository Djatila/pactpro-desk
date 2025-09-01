import React, { createContext, useContext, useState, useEffect } from 'react';

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
  hasAdminRegistered: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  checkAdminExists: () => boolean;
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
  const [hasAdminRegistered, setHasAdminRegistered] = useState(false);

  // Verificar se existe usuário logado e admin registrado no localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('maiacred_user');
    const adminCredentials = localStorage.getItem('maiacred_admin_credentials');
    
    setHasAdminRegistered(!!adminCredentials);
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('maiacred_user');
      }
    }
    setIsLoading(false);
  }, []);

  const checkAdminExists = (): boolean => {
    const adminCredentials = localStorage.getItem('maiacred_admin_credentials');
    return !!adminCredentials;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simular requisição de registro
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se já existe um admin registrado
      if (checkAdminExists()) {
        setIsLoading(false);
        return false;
      }
      
      // Criar hash simples da senha (em produção usar bcrypt ou similar)
      const hashedPassword = btoa(data.password); // Base64 simples para demonstração
      
      const adminCredentials = {
        id: Date.now().toString(),
        nome: data.nome,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        cargo: data.cargo,
        createdAt: new Date().toISOString()
      };
      
      // Salvar credenciais no localStorage
      localStorage.setItem('maiacred_admin_credentials', JSON.stringify(adminCredentials));
      
      // Fazer login automático após registro
      const userData: User = {
        id: adminCredentials.id,
        nome: adminCredentials.nome,
        email: adminCredentials.email,
        cargo: adminCredentials.cargo
      };
      
      setUser(userData);
      localStorage.setItem('maiacred_user', JSON.stringify(userData));
      setHasAdminRegistered(true);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simular requisição de login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar credenciais personalizadas primeiro
      const adminCredentials = localStorage.getItem('maiacred_admin_credentials');
      if (adminCredentials) {
        const admin = JSON.parse(adminCredentials);
        const hashedPassword = btoa(password);
        
        if (admin.email === email.toLowerCase() && admin.password === hashedPassword) {
          const userData: User = {
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
            cargo: admin.cargo
          };
          
          setUser(userData);
          localStorage.setItem('maiacred_user', JSON.stringify(userData));
          setIsLoading(false);
          return true;
        }
      }
      
      // Fallback para credenciais demo (apenas se não houver admin registrado)
      if (!checkAdminExists() && email === 'admin@maiacred.com' && password === '123456') {
        const userData: User = {
          id: '1',
          nome: 'Administrador Demo',
          email: 'admin@maiacred.com',
          cargo: 'Gerente Comercial',
          avatar: undefined
        };
        
        setUser(userData);
        localStorage.setItem('maiacred_user', JSON.stringify(userData));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('maiacred_user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    hasAdminRegistered,
    login,
    register,
    logout,
    checkAdminExists
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}