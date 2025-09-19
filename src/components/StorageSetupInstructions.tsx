import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Database, Lock } from "lucide-react";

export function StorageSetupInstructions() {
  const handleOpenSetupGuide = () => {
    window.open('/SUPABASE_STORAGE_SETUP.md', '_blank');
  };

  const handleOpenSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard/project/emvnudlonqoyfptrdwtd/storage/buckets', '_blank');
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Configuração Necessária para Upload de PDFs
        </CardTitle>
        <CardDescription>
          Siga estas instruções para configurar o storage do Supabase e habilitar o upload de PDFs nos contratos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Passos Necessários:</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                1
              </div>
              <div>
                <h4 className="font-medium">Acessar o Painel do Supabase</h4>
                <p className="text-sm text-muted-foreground">
                  Clique no botão abaixo para abrir o painel do Supabase em uma nova aba.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                2
              </div>
              <div>
                <h4 className="font-medium">Criar o Bucket</h4>
                <p className="text-sm text-muted-foreground">
                  No menu Storage, crie um novo bucket chamado <code className="bg-muted px-1 rounded">contratos-pdfs</code> e habilite URLs públicas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                3
              </div>
              <div>
                <h4 className="font-medium">Configurar Permissões</h4>
                <p className="text-sm text-muted-foreground">
                  Configure as políticas de acesso para permitir upload, leitura, atualização e exclusão de arquivos.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                4
              </div>
              <div>
                <h4 className="font-medium">Verificar Configuração</h4>
                <p className="text-sm text-muted-foreground">
                  Volte ao sistema e tente fazer upload de um PDF novamente.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={handleOpenSupabaseDashboard}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir Painel do Supabase
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleOpenSetupGuide}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Ver Guia Completo
          </Button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Importante
          </h4>
          <p className="text-sm text-yellow-700 mt-1">
            Certifique-se de que as políticas de segurança estejam configuradas corretamente para evitar 
            problemas de permissão. O bucket deve permitir acesso autenticado para todas as operações.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}