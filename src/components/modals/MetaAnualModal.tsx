import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";

interface MetaAnualModalProps {
  isOpen: boolean;
  onClose: () => void;
  metaAtual: number;
  onSave: (meta: number) => void;
}

export function MetaAnualModal({ isOpen, onClose, metaAtual, onSave }: MetaAnualModalProps) {
  const [meta, setMeta] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMeta(metaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  }, [isOpen, metaAtual]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter valor para número removendo formatação
    const metaValue = parseFloat(meta.replace(/[R$.\s]/g, '').replace(',', '.'));
    
    if (isNaN(metaValue) || metaValue <= 0) {
      toast.error('Por favor, insira um valor válido para a meta anual');
      return;
    }

    onSave(metaValue);
    toast.success(`Meta anual definida para R$ ${metaValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    onClose();
  };

  const handleClose = () => {
    setMeta(metaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    onClose();
  };

  const formatCurrency = (value: string) => {
    // Remove tudo exceto dígitos
    const cleanValue = value.replace(/\D/g, '');
    
    // Se estiver vazio, retorna vazio
    if (!cleanValue) return '';
    
    // Converte para número (em centavos) e depois para reais
    const numericValue = parseInt(cleanValue) / 100;
    
    // Formata com separadores brasileiros
    return numericValue.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMeta(formatCurrency(value));
  };

  const metaMensal = meta ? parseFloat(meta.replace(/[R$.\s]/g, '').replace(',', '.')) / 12 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Configurar Meta Anual
          </DialogTitle>
          <DialogDescription>
            Defina sua meta de receita para o ano de 2025
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="meta">Meta Anual de Receita *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="meta"
                value={meta}
                onChange={handleMetaChange}
                className="pl-9"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          {meta && !isNaN(parseFloat(meta.replace(/[R$.\s]/g, '').replace(',', '.'))) && (
            <div className="bg-accent/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Resumo da Meta:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Meta Anual:</p>
                  <p className="font-semibold text-primary">
                    R$ {parseFloat(meta.replace(/[R$.\s]/g, '').replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Meta Mensal:</p>
                  <p className="font-semibold text-success">
                    R$ {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-primary hover:opacity-90">
              Salvar Meta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}