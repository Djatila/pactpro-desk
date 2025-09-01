import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Tag, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface TipoContrato {
  id: string;
  value: string;
  label: string;
  isDefault: boolean;
}

interface TipoContratoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTiposChange: (tipos: TipoContrato[]) => void;
}

export function TipoContratoManagerModal({ 
  isOpen, 
  onClose, 
  onTiposChange 
}: TipoContratoManagerModalProps) {
  const [tipos, setTipos] = useState<TipoContrato[]>([]);
  const [newTipoLabel, setNewTipoLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  // Carregar tipos existentes do localStorage
  useEffect(() => {
    const savedTipos = localStorage.getItem('tiposContrato');
    if (savedTipos) {
      setTipos(JSON.parse(savedTipos));
    } else {
      // Tipos padrão se não houver nada salvo
      const tiposDefault: TipoContrato[] = [
        { id: '1', value: 'consignado-previdencia', label: 'Consignado Previdência', isDefault: true },
        { id: '2', value: 'consignado-clt', label: 'Consignado CLT', isDefault: true },
        { id: '3', value: 'emprestimo-pessoal', label: 'Empréstimo Pessoal', isDefault: true },
        { id: '4', value: 'fgts', label: 'FGTS', isDefault: true },
        { id: '5', value: 'emp-bolsa-familia', label: 'Emp. Bolsa Família', isDefault: true },
        { id: '6', value: 'emp-conta-energia', label: 'Emp. Conta de Energia', isDefault: true },
        { id: '7', value: 'emp-bpc-loas', label: 'Emp. BPC LOAS', isDefault: true }
      ];
      setTipos(tiposDefault);
      localStorage.setItem('tiposContrato', JSON.stringify(tiposDefault));
    }
  }, [isOpen]);

  const generateValue = (label: string): string => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens no início e fim
  };

  const handleAddTipo = () => {
    if (!newTipoLabel.trim()) {
      toast.error('Digite o nome do tipo de contrato');
      return;
    }

    const value = generateValue(newTipoLabel);
    
    // Verificar se já existe
    if (tipos.some(t => t.value === value || t.label.toLowerCase() === newTipoLabel.toLowerCase())) {
      toast.error('Esse tipo de contrato já existe');
      return;
    }

    const newTipo: TipoContrato = {
      id: Date.now().toString(),
      value,
      label: newTipoLabel.trim(),
      isDefault: false
    };

    const updatedTipos = [...tipos, newTipo];
    setTipos(updatedTipos);
    localStorage.setItem('tiposContrato', JSON.stringify(updatedTipos));
    onTiposChange(updatedTipos);
    
    setNewTipoLabel('');
    toast.success('Tipo de contrato adicionado com sucesso!');
  };

  const handleEditTipo = (id: string) => {
    const tipo = tipos.find(t => t.id === id);
    if (tipo) {
      setEditingId(id);
      setEditingLabel(tipo.label);
    }
  };

  const handleSaveEdit = () => {
    if (!editingLabel.trim()) {
      toast.error('Digite o nome do tipo de contrato');
      return;
    }

    const updatedTipos = tipos.map(tipo => 
      tipo.id === editingId 
        ? { ...tipo, label: editingLabel.trim(), value: generateValue(editingLabel) }
        : tipo
    );

    setTipos(updatedTipos);
    localStorage.setItem('tiposContrato', JSON.stringify(updatedTipos));
    onTiposChange(updatedTipos);
    
    setEditingId(null);
    setEditingLabel('');
    toast.success('Tipo de contrato atualizado com sucesso!');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingLabel('');
  };

  const handleDeleteTipo = (id: string) => {
    const tipo = tipos.find(t => t.id === id);
    
    if (tipo?.isDefault) {
      toast.error('Não é possível excluir tipos de contrato padrão do sistema');
      return;
    }

    const updatedTipos = tipos.filter(t => t.id !== id);
    setTipos(updatedTipos);
    localStorage.setItem('tiposContrato', JSON.stringify(updatedTipos));
    onTiposChange(updatedTipos);
    
    toast.success('Tipo de contrato removido com sucesso!');
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        handleAddTipo();
      } else {
        handleSaveEdit();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Gerenciar Tipos de Contrato
          </DialogTitle>
          <DialogDescription>
            Adicione, edite ou remova tipos de contrato personalizados. Os tipos padrão do sistema não podem ser removidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar novo tipo */}
          <Card className="border-dashed border-2 border-primary/30">
            <CardContent className="p-4">
              <div className="space-y-3">
                <Label htmlFor="newTipo">Adicionar Novo Tipo de Contrato</Label>
                <div className="flex gap-2">
                  <Input
                    id="newTipo"
                    placeholder="Ex: Crédito Imobiliário, Financiamento Veículos..."
                    value={newTipoLabel}
                    onChange={(e) => setNewTipoLabel(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'add')}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddTipo}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de tipos existentes */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary-dark">Tipos de Contrato Existentes</h3>
            
            <div className="space-y-2">
              {tipos.map((tipo) => (
                <Card key={tipo.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        
                        {editingId === tipo.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              onKeyPress={(e) => handleKeyPress(e, 'edit')}
                              className="flex-1"
                              autoFocus
                            />
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={handleSaveEdit}
                              className="text-success hover:text-success"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 flex-1">
                            <div>
                              <p className="font-medium">{tipo.label}</p>
                              <p className="text-xs text-muted-foreground">
                                Valor: {tipo.value}
                              </p>
                            </div>
                            
                            {tipo.isDefault && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Padrão
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {editingId !== tipo.id && (
                        <div className="flex items-center gap-1">
                          {!tipo.isDefault && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditTipo(tipo.id)}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteTipo(tipo.id)}
                            disabled={tipo.isDefault}
                            className={tipo.isDefault 
                              ? "text-muted-foreground cursor-not-allowed opacity-50" 
                              : "text-muted-foreground hover:text-destructive"
                            }
                            title={tipo.isDefault ? "Tipos padrão não podem ser removidos" : "Remover tipo"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {tipos.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhum tipo de contrato cadastrado
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione o primeiro tipo de contrato usando o formulário acima.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}