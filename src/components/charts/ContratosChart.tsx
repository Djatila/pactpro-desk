import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface ContratosPorMesData {
  mes: string;
  contratos: number;
  receita: number;
}

interface ContratosPorBancoData {
  banco: string;
  contratos: number;
  percentual: number;
  fill: string;
}

// Função para calcular evolução mensal baseada nos contratos reais
const calculateMonthlyEvolution = (contratos: any[]): ContratosPorMesData[] => {
  if (!contratos.length) return [];
  
  // Obter data atual
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  // Gerar últimos 6 meses
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    months.push({
      mes: monthNames[date.getMonth()],
      monthYear: `${date.getMonth() + 1}/${date.getFullYear()}`,
      contratos: 0,
      receita: 0
    });
  }
  
  // Processar contratos para cada mês
  contratos.forEach(contrato => {
    try {
      // Converter data DD/MM/AAAA para análise
      const [day, month, year] = contrato.dataEmprestimo.split('/');
      const contratoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const contratoMonthYear = `${contratoDate.getMonth() + 1}/${contratoDate.getFullYear()}`;
      
      // Encontrar mês correspondente
      const monthData = months.find(m => m.monthYear === contratoMonthYear);
      if (monthData) {
        monthData.contratos += 1;
        
        // Calcular receita baseada na taxa e valor
        const receitaString = contrato.receitaAgente
          .replace(/[R$\s]/g, '') // Remove R$ e espaços
          .replace(/\./g, '')      // Remove pontos (separadores de milhares)
          .replace(',', '.');      // Substitui vírgula por ponto decimal
        const receitaValue = parseFloat(receitaString) || 0;
        monthData.receita += receitaValue;
      }
    } catch (error) {
      // Ignorar contratos com data inválida
      console.warn('Data inválida no contrato:', contrato.dataEmprestimo);
    }
  });
  
  // Remover propriedade auxiliar e retornar
  return months.map(({ monthYear, ...rest }) => rest);
};

// Função para calcular distribuição real por banco
const calculateBancoDistribution = (contratos: any[], bancos: any[]): ContratosPorBancoData[] => {
  if (!contratos.length) return [];
  
  // Contar contratos por banco
  const contratosCountByBanco: { [key: string]: { count: number; nome: string } } = {};
  
  contratos.forEach(contrato => {
    const bancoNome = contrato.bancoNome;
    if (contratosCountByBanco[bancoNome]) {
      contratosCountByBanco[bancoNome].count++;
    } else {
      contratosCountByBanco[bancoNome] = { count: 1, nome: bancoNome };
    }
  });
  
  const totalContratos = contratos.length;
  const cores = ['#1B6C4A', '#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];
  
  // Converter para formato do gráfico
  const distribution = Object.entries(contratosCountByBanco)
    .map(([_, data], index) => ({
      banco: data.nome,
      contratos: data.count,
      percentual: Math.round((data.count / totalContratos) * 100),
      fill: cores[index % cores.length]
    }))
    .sort((a, b) => b.contratos - a.contratos); // Ordenar por número de contratos
  
  return distribution;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey === 'receita' ? 'Receita' : 'Contratos'}: ${
              entry.dataKey === 'receita' 
                ? `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                : entry.value
            }`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{data.banco}</p>
        <p className="text-sm text-muted-foreground">
          {data.contratos} contratos ({data.percentual}%)
        </p>
      </div>
    );
  }
  return null;
};

export function ContratosChart() {
  const { contratos, bancos } = useData();
  
  // Calcular evolução mensal real
  const contratosPorMes = calculateMonthlyEvolution(contratos);
  
  // Calcular distribuição real dos contratos por banco
  const contratosPorBanco = calculateBancoDistribution(contratos, bancos);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Gráfico de Barras - Evolução Mensal */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução Mensal
          </CardTitle>
          <CardDescription>
            Contratos fechados e receita por mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contratosPorMes.length > 0 && contratosPorMes.some(m => m.contratos > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contratosPorMes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="contratos" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="Contratos"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhum contrato encontrado
              </h3>
              <p className="text-sm text-muted-foreground">
                Cadastre contratos para visualizar a evolução mensal.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Pizza - Distribuição por Banco */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Distribuição por Banco
          </CardTitle>
          <CardDescription>
            Percentual de contratos por instituição
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contratosPorBanco.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contratosPorBanco}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="contratos"
                  >
                    {contratosPorBanco.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legenda */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {contratosPorBanco.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-muted-foreground truncate">
                      {item.banco}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {item.contratos} ({item.percentual}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhum contrato encontrado
              </h3>
              <p className="text-sm text-muted-foreground">
                Cadastre contratos para visualizar a distribuição por banco.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}