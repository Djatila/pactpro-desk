import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Database, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function StorageStatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'error' | 'not-configured'>('checking');
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);

  useEffect(() => {
    checkStorageStatus();
  }, []);

  const checkStorageStatus = async () => {
    try {
      setStatus('checking');
      
      // Verificar se o serviço de storage está disponível
      if (!supabase.storage) {
        setStatus('not-configured');
        return;
      }
      
      // Verificar se o bucket existe
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Erro ao verificar storage:', error);
        setStatus('error');
        return;
      }
      
      const exists = buckets?.some(bucket => bucket.name === 'contratos-pdfs');
      setBucketExists(!!exists);
      
      if (exists) {
        setStatus('ready');
      } else {
        setStatus('not-configured');
      }
    } catch (error) {
      console.error('Erro ao verificar status do storage:', error);
      setStatus('error');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {status === 'checking' && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Verificando storage
        </Badge>
      )}
      
      {status === 'ready' && (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3" />
          Storage configurado
        </Badge>
      )}
      
      {status === 'not-configured' && (
        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3" />
          Storage não configurado
        </Badge>
      )}
      
      {status === 'error' && (
        <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3" />
          Erro no storage
        </Badge>
      )}
      
      <button 
        onClick={checkStorageStatus}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        title="Verificar status do storage"
      >
        <Database className="h-4 w-4" />
      </button>
    </div>
  );
}