import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileText, Database, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorMessageDisplayProps {
  error: string;
  onRetry?: () => void;
  onSetupGuide?: () => void;
}

export function ErrorMessageDisplay({ error, onRetry, onSetupGuide }: ErrorMessageDisplayProps) {
  // Determinar o tipo de erro e fornecer solução apropriada
  const getErrorInfo = () => {
    if (error.includes('Bucket not found')) {
      return {
        icon: Database,
        title: "Bucket de Storage Não Encontrado",
        description: "O bucket 'contratos-pdfs' não foi encontrado no Supabase.",
        solution: "Configure o storage do Supabase seguindo as instruções abaixo."
      };
    }
    
    if (error.includes('Permission denied')) {
      return {
        icon: AlertCircle,
        title: "Permissão Negada",
        description: "Você não tem permissão para acessar o storage do Supabase.",
        solution: "Verifique as políticas de acesso ao bucket no painel do Supabase."
      };
    }
    
    if (error.includes('storage')) {
      return {
        icon: Database,
        title: "Problema com Storage",
        description: "Houve um erro ao acessar o serviço de storage do Supabase.",
        solution: "Verifique sua conexão e as configurações do storage."
      };
    }
    
    if (error.includes('Timeout')) {
      return {
        icon: WifiOff,
        title: "Tempo de Conexão Expirado",
        description: "A conexão com o servidor está demorando muito.",
        solution: "Verifique sua conexão com a internet e tente novamente."
      };
    }
    
    return {
      icon: AlertCircle,
      title: "Erro ao Processar Solicitação",
      description: error,
      solution: "Tente novamente ou entre em contato com o suporte."
    };
  };

  const errorInfo = getErrorInfo();
  const IconComponent = errorInfo.icon;

  return (
    <Alert variant="destructive">
      <IconComponent className="h-4 w-4" />
      <AlertTitle>{errorInfo.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{errorInfo.description}</p>
        <p className="text-sm font-medium">{errorInfo.solution}</p>
        
        <div className="flex flex-wrap gap-2 pt-2">
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="text-destructive hover:text-destructive"
            >
              Tentar Novamente
            </Button>
          )}
          
          {onSetupGuide && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSetupGuide}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Ver Guia de Configuração
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}