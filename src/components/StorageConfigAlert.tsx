import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink } from "lucide-react";

interface StorageConfigAlertProps {
  onRetry?: () => void;
}

export function StorageConfigAlert({ onRetry }: StorageConfigAlertProps) {
  const handleSetupGuide = () => {
    // Abrir o guia de configuração em uma nova aba
    window.open('/SUPABASE_STORAGE_SETUP.md', '_blank');
  };

  const handleSupabaseDashboard = () => {
    // Abrir o painel do Supabase
    window.open('https://supabase.com/dashboard/project/emvnudlonqoyfptrdwtd/storage/buckets', '_blank');
  };

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Configuração de Storage Necessária</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          O sistema não conseguiu acessar o storage para upload de PDFs. 
          É necessário configurar o bucket "contratos-pdfs" no painel do Supabase.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSetupGuide}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Ver Guia de Configuração
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSupabaseDashboard}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir Painel do Supabase
          </Button>
          
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
            >
              Tentar Novamente
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}