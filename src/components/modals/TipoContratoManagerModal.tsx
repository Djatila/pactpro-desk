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
import { useData } from '@/contexts/DataContext';

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
  const dataContext = useData();
  
  // Removido logs para evitar loop infinito
  // console.log('DataContext:', dataContext);
  // console.log('loadTiposContrato existe:', !!dataContext.loadTiposContrato);
  // console.log('loadTiposContrato é função:', typeof dataContext.loadTiposContrato === 'function');
  
  const { loadTiposContrato, addTipoContrato, updateTipoContrato, deleteTipoContrato } = dataContext;
  const [tipos, setTipos] = useState<TipoContrato[]>([]);
  const [newTipoLabel, setNewTipoLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Carregar tipos existentes do banco de dados
  useEffect(() => {
    if (isOpen) {
      // Removido log para evitar loop infinito
      // console.log('Carregando tipos de contrato no modal de gerenciamento...');
      loadTiposFromDatabase();
    }
  }, [isOpen]); // Removido loadTiposContrato das dependências para evitar loop

  const loadTiposFromDatabase = async () => {
    // Verificar novamente antes de chamar
    // console.log('Tentando chamar loadTiposContrato');
    // console.log('loadTiposContrato:', loadTiposContrato);
    
    if (typeof loadTiposContrato !== 'function') {
      console.error('loadTiposContrato não é uma função válida');
      toast.error('Erro na configuração do sistema de tipos de contrato');
      return;
    }
    
    setIsLoading(true);
    try {
      // Removido logs para evitar loop infinito
      // console.log('Carregando tipos de contrato do banco de dados...');
      const tiposFromDB = await loadTiposContrato();
      // console.log('Tipos de contrato carregados do banco de dados:', tiposFromDB);
      
      // Converter os objetos retornados para o formato esperado
      const formattedTipos = tiposFromDB.map((tipo: any) => ({
        id: tipo.id,
        value: tipo.value,
        label: tipo.label,
        isDefault: tipo.isDefault || tipo.is_default || false
      }));
      // console.log('Tipos de contrato formatados:', formattedTipos);
      setTipos(formattedTipos);
    } catch (error) {
      console.error('Erro ao carregar tipos de contrato:', error);
      toast.error('Erro ao carregar tipos de contrato');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAddTipo = async () => {
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

    setIsLoading(true);
    try {
      // Removido log para evitar loop infinito
      // console.log('Adicionando novo tipo de contrato:', { value, label: newTipoLabel.trim() });
      const result = await addTipoContrato({
        value,
        label: newTipoLabel.trim(),
        is_default: false
      });

      if (result) {
        // Removido log para evitar loop infinito
        // console.log('Tipo de contrato adicionado com sucesso, recarregando...');
        await loadTiposFromDatabase();
        setNewTipoLabel('');
        toast.success('Tipo de contrato adicionado com sucesso!');
        // Chamar o callback para notificar que os tipos mudaram
        onTiposChange(tipos);
      } else {
        toast.error('Erro ao adicionar tipo de contrato. Verifique o console para mais detalhes.');
      }
    } catch (error: any) {
      console.error('Erro ao adicionar tipo de contrato:', error);
      toast.error(`Erro ao adicionar tipo de contrato: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTipo = (id: string) => {
    // Removido log para evitar loop infinito
    // console.log('Editando tipo de contrato:', id);
    const tipo = tipos.find(t => t.id === id);
    if (tipo) {
      setEditingId(id);
      setEditingLabel(tipo.label);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingLabel.trim()) {
      toast.error('Digite o nome do tipo de contrato');
      return;
    }

    if (!editingId) return;

    setIsLoading(true);
    try {
      // Removido log para evitar loop infinito
      // console.log('Salvando edição do tipo de contrato:', { id: editingId, label: editingLabel.trim() });
      const result = await updateTipoContrato(editingId, {
        label: editingLabel.trim(),
        value: generateValue(editingLabel)
      });

      if (result) {
        // Removido log para evitar loop infinito
        // console.log('Tipo de contrato atualizado com sucesso, recarregando...');
        await loadTiposFromDatabase();
        setEditingId(null);
        setEditingLabel('');
        toast.success('Tipo de contrato atualizado com sucesso!');
        // Chamar o callback para notificar que os tipos mudaram
        onTiposChange(tipos);
      } else {
        toast.error('Erro ao atualizar tipo de contrato. Verifique o console para mais detalhes.');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar tipo de contrato:', error);
      toast.error(`Erro ao atualizar tipo de contrato: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingLabel('');
  };

  const handleDeleteTipo = async (id: string) => {
    // Removido log para evitar loop infinito
    // console.log('Removendo tipo de contrato:', id);
    const tipo = tipos.find(t => t.id === id);
    
    if (tipo?.isDefault) {
      toast.error('Não é possível excluir tipos de contrato padrão do sistema');
      return;
    }

    setIsLoading(true);
    try {
      // Removido log para evitar loop infinito
      // console.log('Removendo tipo de contrato do banco de dados...');
      const result = await deleteTipoContrato(id);
      
      if (result) {
        // Removido log para evitar loop infinito
        // console.log('Tipo de contrato removido com sucesso, recarregando...');
        await loadTiposFromDatabase();
        toast.success('Tipo de contrato removido com sucesso!');
        // Chamar o callback para notificar que os tipos mudaram
        onTiposChange(tipos);
      } else {
        toast.error('Erro ao remover tipo de contrato. Verifique o console para mais detalhes.');
      }
    } catch (error: any) {
      console.error('Erro ao remover tipo de contrato:', error);
      toast.error(`Erro ao remover tipo de contrato: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
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
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleAddTipo}
                    className="bg-gradient-primary hover:opacity-90"
                    disabled={isLoading}
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
                              disabled={isLoading}
                            />
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={handleSaveEdit}
                              className="text-success hover:text-success"
                              disabled={isLoading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="text-muted-foreground hover:text-destructive"
                              disabled={isLoading}
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
                              disabled={isLoading}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteTipo(tipo.id)}
                            disabled={tipo.isDefault || isLoading}
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

            {tipos.length === 0 && !isLoading && (
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