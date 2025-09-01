import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface ReceitaData {
  mes: string;
  receita: number;
  meta: number;
  crescimento: number;
}

// Função para calcular dados de receita baseados nos contratos reais
const calculateReceitaData = (contratos: any[], metaAnual: number) => {
  const currentYear = 2025;
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  
  const metaMensal = metaAnual / 12; // Dividir meta anual por 12 meses
  
  // Inicializar dados dos meses
  const receitaData: ReceitaData[] = months.map((mes, index) => ({
    mes,
    receita: 0,
    meta: metaMensal,
    crescimento: 0
  }));
  
  // Processar contratos para cada mês
  contratos.forEach(contrato => {
    try {
      const [dia, mes, ano] = contrato.dataEmprestimo.split('/');
      if (parseInt(ano) === currentYear) {
        const monthIndex = parseInt(mes) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          // Calcular receita
          const receitaString = contrato.receitaAgente
            .replace(/[R$\s]/g, '') // Remove R$ e espaços
            .replace(/\./g, '')      // Remove pontos (separadores de milhares)
            .replace(',', '.');      // Substitui vírgula por ponto decimal
          const receitaValue = parseFloat(receitaString) || 0;
          receitaData[monthIndex].receita += receitaValue;
        }
      }
    } catch (error) {
      console.warn('Data inválida no contrato:', contrato.dataEmprestimo);
    }
  });
  
  // Calcular crescimento mês a mês
  for (let i = 1; i < receitaData.length; i++) {
    const anterior = receitaData[i - 1].receita;
    const atual = receitaData[i].receita;
    if (anterior > 0) {
      receitaData[i].crescimento = ((atual - anterior) / anterior) * 100;
    }
  }
  
  return receitaData;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey === 'meta' ? 'Meta' : 'Receita'}: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const GrowthTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{`${label}`}</p>
        <p className="text-sm" style={{ color: payload[0].color }}>
          Crescimento: {payload[0].value > 0 ? '+' : ''}{payload[0].value.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export function ReceitaChart() {
  const { contratos, metaAnual } = useData();
  const receitaData = calculateReceitaData(contratos, metaAnual);
  
  const totalReceita = receitaData.reduce((acc, item) => acc + item.receita, 0);
  const totalMeta = receitaData.reduce((acc, item) => acc + item.meta, 0);
  const performance = totalMeta > 0 ? ((totalReceita / totalMeta) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Resumo da Performance */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-success p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Anual</p>
                <p className="text-xl font-bold text-success">
                  R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Meta Anual</p>
                <p className="text-xl font-bold text-primary-dark">
                  R$ {totalMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                parseFloat(performance) >= 100 ? 'bg-gradient-success' : 'bg-warning'
              }`}>
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className={`text-xl font-bold ${
                  parseFloat(performance) >= 100 ? 'text-success' : 'text-warning'
                }`}>
                  {performance}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha - Receita vs Meta */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Receita vs Meta Mensal
          </CardTitle>
          <CardDescription>
            Acompanhamento da receita mensal comparada com as metas estabelecidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={receitaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="mes" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="meta" 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 4 }}
                name="Meta"
              />
              <Line 
                type="monotone" 
                dataKey="receita" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                name="Receita"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Área - Crescimento */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Taxa de Crescimento Mensal
          </CardTitle>
          <CardDescription>
            Percentual de crescimento da receita mês a mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={receitaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="mes" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <Tooltip content={<GrowthTooltip />} />
              <Area 
                type="monotone" 
                dataKey="crescimento" 
                stroke="hsl(var(--success))" 
                fill="hsl(var(--success))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}