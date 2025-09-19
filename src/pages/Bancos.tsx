import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BancoFormModal } from "@/components/forms/BancoFormModal";
import { BancoDetailModal } from "@/components/modals/BancoDetailModal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { useData } from "@/contexts/DataContext";
import { type BancoFormData } from "@/lib/validations";
import { 
  Plus, 
  Search, 
  Building2, 
  Edit,
  Trash2,
  Eye,
  FileText
} from "lucide-react";
import { toast } from "sonner";

export default function Bancos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanco, setEditingBanco] = useState<any>(null);
  const [viewingBanco, setViewingBanco] = useState<any>(null);
  const [deletingBanco, setDeletingBanco] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { bancos, contratos, addBanco, updateBanco, deleteBanco } = useData();
  const navigate = useNavigate();

  const handleCreateBanco = async (data: BancoFormData) => {
    try {
      addBanco({
        nome: data.nome,
        codigo: data.codigo,
        taxaMedia: data.taxaMedia || 0,
        contato: data.contato || '',
        telefoneContato: data.telefoneContato || '',
        observacoes: data.observacoes || ''
      });
      toast.success('Banco cadastrado com sucesso!');
    } catch (error) {
      toast.error('Erro ao cadastrar banco');
      throw error;
    }
  };

  const handleEditBanco = async (data: BancoFormData) => {
    try {
      if (editingBanco) {
        updateBanco(editingBanco.id, {
          nome: data.nome,
          codigo: data.codigo,
          taxaMedia: data.taxaMedia || 0,
          contato: data.contato || '',
          telefoneContato: data.telefoneContato || '',
          observacoes: data.observacoes || ''
        });
        setEditingBanco(null);
        toast.success('Banco atualizado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar banco');
      throw error;
    }
  };

  const openEditModal = (banco: any) => {
    setEditingBanco(banco);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanco(null);
  };

  const handleViewBanco = (banco: any) => {
    setViewingBanco(banco);
    setIsDetailModalOpen(true);
  };

  const handleDeleteBanco = (banco: any) => {
    setDeletingBanco(banco);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteBanco = async () => {
    try {
      if (deletingBanco) {
        deleteBanco(deletingBanco.id);
        toast.success('Banco excluído com sucesso!');
        setIsDeleteModalOpen(false);
        setDeletingBanco(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir banco');
    }
  };

  const handleVerContratos = (bancoId: string) => {
    // Navegar para página de contratos com filtro do banco
    navigate(`/contratos?banco=${bancoId}`);
    toast.info('Mostrando contratos do banco selecionado...');
  };

  const filteredBancos = bancos
    .filter(banco =>
      banco.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banco.codigo.includes(searchTerm)
    )
    .sort((a, b) => {
      // Ordenação estável: primeiro por número de contratos (maior para menor)
      const contratosDiff = b.contratos - a.contratos;
      if (contratosDiff !== 0) return contratosDiff;
      
      // Se o número de contratos for igual, ordenar por nome (A-Z)
      const nomeComparison = a.nome.localeCompare(b.nome);
      if (nomeComparison !== 0) return nomeComparison;
      
      // Se nome também for igual, ordenar por ID para garantir ordem consistente
      return a.id.localeCompare(b.id);
    });

  const bancosAtivos = bancos.filter(b => b.status === 'ativo');
  // Calcular métricas baseadas nos contratos reais
  const totalContratos = contratos.length;
  const volumeTotal = contratos.reduce((acc, contrato) => acc + contrato.valorTotal, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Bancos</h1>
          <p className="text-muted-foreground">Gerencie instituições financeiras parceiras</p>
        </div>
        <Button 
          className="bg-gradient-primary hover:opacity-90"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Banco
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bancos</p>
                <p className="text-xl font-bold text-primary-dark">{bancos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-success p-2 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bancos Ativos</p>
                <p className="text-xl font-bold text-success">{bancosAtivos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-info p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contratos</p>
                <p className="text-xl font-bold text-info">{totalContratos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning p-2 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volume Total</p>
                <p className="text-xl font-bold text-warning">R$ {(volumeTotal / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou código do banco..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              Filtros Avançados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Banks Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBancos.map((banco, index) => (
          <Card key={`banco-${banco.id}-${index}`} className="shadow-card hover:shadow-card-hover transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-primary-dark">
                      {banco.nome}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Código: {banco.codigo}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={banco.status === "ativo" ? "default" : "secondary"}
                  className={banco.status === "ativo" ? "bg-success text-success-foreground" : ""}
                >
                  {banco.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-accent/50 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-primary-dark">{banco.contratos}</p>
                  <p className="text-xs text-muted-foreground">Contratos</p>
                </div>
                <div className="bg-accent/50 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-success">{banco.volumeTotal}</p>
                  <p className="text-xs text-muted-foreground">Volume</p>
                </div>
              </div>

              {/* Observations */}
              <div className="bg-accent/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Observações:</p>
                <p className="text-sm leading-relaxed">{banco.observacoes}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleViewBanco(banco)}
                    title="Visualizar detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => openEditModal(banco)}
                    title="Editar banco"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteBanco(banco)}
                    title="Excluir banco"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleVerContratos(banco.id)}
                >
                  Ver Contratos
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBancos.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum banco encontrado
            </h3>
            <p className="text-sm text-muted-foreground">
              Tente ajustar os filtros de busca ou cadastre um novo banco.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Formulário */}
      <BancoFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingBanco ? handleEditBanco : handleCreateBanco}
        initialData={editingBanco}
        mode={editingBanco ? 'edit' : 'create'}
      />

      {/* Modal de Detalhes */}
      <BancoDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingBanco(null);
        }}
        banco={viewingBanco}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingBanco(null);
        }}
        onConfirm={confirmDeleteBanco}
        title="Excluir Banco"
        description="Tem certeza que deseja excluir este banco? Esta ação não pode ser desfeita. Note que não é possível excluir um banco que possui contratos."
        itemName={deletingBanco?.nome}
      />
    </div>
  );
}