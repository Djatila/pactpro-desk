import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { StatsCard } from './StatsCard';
import { Users } from 'lucide-react';

describe('StatsCard', () => {
  const defaultProps = {
    title: 'Total de Clientes',
    value: '48',
    description: 'Ativos no sistema',
    icon: Users,
  };

  it('deve renderizar com as props básicas', () => {
    render(<StatsCard {...defaultProps} />);
    
    expect(screen.getByText('Total de Clientes')).toBeInTheDocument();
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('Ativos no sistema')).toBeInTheDocument();
  });

  it('deve renderizar trend positivo corretamente', () => {
    const propsWithTrend = {
      ...defaultProps,
      trend: { value: '12%', isPositive: true }
    };
    
    render(<StatsCard {...propsWithTrend} />);
    
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toHaveClass('text-success');
  });

  it('deve renderizar trend negativo corretamente', () => {
    const propsWithTrend = {
      ...defaultProps,
      trend: { value: '5%', isPositive: false }
    };
    
    render(<StatsCard {...propsWithTrend} />);
    
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('5%')).toHaveClass('text-destructive');
  });

  it('deve aplicar gradiente correto baseado na prop gradient', () => {
    const { rerender } = render(<StatsCard {...defaultProps} gradient="success" />);
    
    // Verifica se a classe de gradiente success está aplicada
    expect(document.querySelector('.bg-gradient-success')).toBeInTheDocument();
    
    // Testa outros gradientes
    rerender(<StatsCard {...defaultProps} gradient="warning" />);
    expect(document.querySelector('.bg-warning')).toBeInTheDocument();
    
    rerender(<StatsCard {...defaultProps} gradient="info" />);
    expect(document.querySelector('.bg-info')).toBeInTheDocument();
  });

  it('deve renderizar sem description quando não fornecida', () => {
    const propsWithoutDescription = {
      title: 'Total de Clientes',
      value: '48',
      icon: Users,
    };
    
    render(<StatsCard {...propsWithoutDescription} />);
    
    expect(screen.getByText('Total de Clientes')).toBeInTheDocument();
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.queryByText('Ativos no sistema')).not.toBeInTheDocument();
  });
});