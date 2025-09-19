import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePdfUpload } from '@/hooks/usePdfUpload';
import { File, Upload, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { StorageConfigAlert } from '@/components/StorageConfigAlert';
import { ErrorMessageDisplay } from '@/components/ErrorMessageDisplay';

interface ContratoPdfManagerProps {
  contratoId: string;
  pdfUrl?: string;
  pdfName?: string;
  onPdfUpdate?: (pdfUrl: string | null, pdfName: string | null) => void;
}

export function ContratoPdfManager({ contratoId, pdfUrl, pdfName, onPdfUpdate }: ContratoPdfManagerProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showStorageAlert, setShowStorageAlert] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadPdf, error } = usePdfUpload({ contratoId });

  // Função para lidar com o upload de PDF
  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Removido log para evitar loop infinito
    // console.log('PDF change triggered');
    const file = e.target.files?.[0];
    if (file) {
      // Removido log para evitar loop infinito
      // console.log('File selected:', file.name);
      // Verificar se é um PDF
      if (file.type !== 'application/pdf') {
        toast.error('Por favor, selecione um arquivo PDF válido.');
        // Limpar o input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Verificar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('O arquivo PDF deve ter no máximo 10MB.');
        // Limpar o input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setPdfFile(file);
      
      // Fazer upload imediatamente
      await handleUploadPdf(file);
    }
  };

  // Função para fazer upload do PDF
  const handleUploadPdf = async (file: File) => {
    // Removido log para evitar loop infinito
    // console.log('Starting PDF upload for contrato:', contratoId);
    setShowStorageAlert(false); // Ocultar alerta anterior
    setLastError(null); // Limpar erro anterior
    try {
      const result = await uploadPdf(file);
      if (result) {
        // Limpar o input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setPdfFile(null);
        // Não fechar o modal, apenas atualizar a interface
      } else {
        // Verificar se há mensagem de erro específica
        const errorMessage = error || 'Erro desconhecido ao anexar PDF';
        setLastError(errorMessage);
        
        // Verificar se é um erro relacionado ao storage
        if (errorMessage.includes('Bucket not found') || errorMessage.includes('storage')) {
          setShowStorageAlert(true);
        }
        toast.error(`Erro ao anexar PDF: ${errorMessage}`);
        // Limpar o input em caso de erro
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao anexar PDF';
      setLastError(errorMessage);
      toast.error(`Erro ao anexar PDF: ${errorMessage}`);
      console.error('Erro ao fazer upload do PDF:', error);
      // Limpar o input em caso de erro
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Função para remover PDF
  const handleRemovePdf = async () => {
    setShowStorageAlert(false); // Ocultar alerta anterior
    setLastError(null); // Limpar erro anterior
    try {
      // Remover o PDF do contrato
      const result = await uploadPdf(null);
      if (result) {
        onPdfUpdate?.(null, null);
      } else {
        // Verificar se há mensagem de erro específica
        const errorMessage = error || 'Erro desconhecido ao remover PDF';
        setLastError(errorMessage);
        
        // Verificar se é um erro relacionado ao storage
        if (errorMessage.includes('Bucket not found') || errorMessage.includes('storage')) {
          setShowStorageAlert(true);
        }
        toast.error(`Erro ao remover PDF: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover PDF';
      setLastError(errorMessage);
      toast.error(`Erro ao remover PDF: ${errorMessage}`);
      console.error('Erro ao remover PDF:', error);
    }
  };

  // Função para fazer download do PDF
  const handleDownloadPdf = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  // Função para tentar novamente após configurar o storage
  const handleRetry = () => {
    setShowStorageAlert(false);
    setLastError(null);
    // Forçar uma nova tentativa de upload se houver um arquivo selecionado
    if (pdfFile && fileInputRef.current) {
      // Criar um novo evento para disparar o upload
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  };

  // Função para abrir o guia de configuração
  const handleSetupGuide = () => {
    window.open('/SUPABASE_STORAGE_SETUP.md', '_blank');
  };

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-lg flex items-center gap-2">
        <File className="h-5 w-5 text-primary" />
        Documento do Contrato (PDF)
      </h3>
      
      {showStorageAlert && (
        <StorageConfigAlert onRetry={handleRetry} />
      )}
      
      {lastError && (
        <ErrorMessageDisplay 
          error={lastError} 
          onRetry={handleRetry}
          onSetupGuide={handleSetupGuide}
        />
      )}
      
      {pdfUrl ? (
        <Card className="border-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-success">{pdfName || 'Documento PDF'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadPdf}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Baixar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRemovePdf}
                  disabled={isUploading}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">Clique no botão abaixo👇</p>
              <p className="text-sm text-muted-foreground mb-3">ou</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PDF máximo 10MB
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePdfChange}
              accept=".pdf,application/pdf"
              className="hidden"
              disabled={isUploading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}