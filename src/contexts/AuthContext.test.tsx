import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { AuthProvider, useAuth } from './AuthContext';
import React from 'react';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Componente de teste para usar o hook
const TestComponent = () => {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Carregando...' : 'Não carregando'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Autenticado' : 'Não autenticado'}</div>
      <div data-testid="user-name">{user?.nome || 'Nenhum usuário'}</div>
      <button
        onClick={() => login('admin@maiacred.com', '123456')}
        data-testid="login-btn"
      >
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('deve inicializar com usuário não autenticado', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Não carregando');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Não autenticado');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Nenhum usuário');
  });

  it('deve carregar usuário do localStorage se existir', async () => {
    const userData = {
      id: '1',
      nome: 'João Silva',
      email: 'admin@maiacred.com',
      cargo: 'Gerente Comercial'
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Autenticado');
    });

    expect(screen.getByTestId('user-name')).toHaveTextContent('João Silva');
  });

  it('deve fazer login com credenciais válidas', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Aguarda o loading inicial
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Não carregando');
    });

    fireEvent.click(screen.getByTestId('login-btn'));

    // Verifica loading durante login
    expect(screen.getByTestId('loading')).toHaveTextContent('Carregando...');

    // Aguarda conclusão do login
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Autenticado');
    }, { timeout: 2000 });

    expect(screen.getByTestId('user-name')).toHaveTextContent('João Silva');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'maiacred_user',
      expect.stringContaining('João Silva')
    );
  });

  it('deve fazer logout corretamente', async () => {
    const userData = {
      id: '1',
      nome: 'João Silva',
      email: 'admin@maiacred.com',
      cargo: 'Gerente Comercial'
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Aguarda usuário ser carregado
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Autenticado');
    });

    fireEvent.click(screen.getByTestId('logout-btn'));

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Não autenticado');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Nenhum usuário');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('maiacred_user');
  });

  it('deve lidar com localStorage corrompido', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.getItem.mockReturnValue('dados-inválidos');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Não carregando');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Não autenticado');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('maiacred_user');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});