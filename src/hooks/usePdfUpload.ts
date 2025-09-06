import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';

interface UsePdfUploadProps {
  contratoId: string;
}

interface UsePdfUploadReturn {
  isUploading: boolean;
  uploadPdf: (file: File | null) => Promise<boolean>;
  error: string | null;
}

export function usePdfUpload({ contratoId }: UsePdfUploadProps): UsePdfUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { uploadContratoPdf } = useData();

  const uploadPdf = async (file: File | null): Promise<boolean> => {
    setIsUploading(true);
    setError(null);
    
    try {
      const result = await uploadContratoPdf(contratoId, file);
      
      if (result) {
        toast.success(file ? 'PDF anexado com sucesso!' : 'PDF removido com sucesso!');
        return true;
      } else {
        const errorMessage = 'Erro ao processar PDF. Tente novamente.';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(`Erro: ${errorMessage}`);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadPdf,
    error
  };
}