import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClienteFormModal } from "@/components/forms/ClienteFormModal";
import { ClienteDetailModal } from "@/components/modals/ClienteDetailModal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { useData } from "@/contexts/DataContext";
import { type ClienteFormData } from "@/lib/validations";
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail,
  MapPin,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { toast } from "sonner";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [viewingCliente, setViewingCliente] = useState<any>(null);
  const [deletingCliente, setDeletingCliente] = useState<any>(null);
  const { clientes, addCliente, updateCliente, deleteCliente } = useData();

  const handleCreateCliente = async (data: ClienteFormData) => {
    try {
      addCliente(data as Omit<any, 'id' | 'contratos' | 'status'>);
      toast.success('Cliente cadastrado com sucesso!');
    } catch (error) {
      toast.error('Erro ao cadastrar cliente');
      throw error;
    }
  };

  const handleEditCliente = async (data: ClienteFormData) => {
    try {
      if (editingCliente) {
        updateCliente(editingCliente.id, data);
        setEditingCliente(null);
        toast.success('Cliente atualizado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar cliente');
      throw error;
    }
  };

  const handleDeleteCliente = () => {
    try {
      if (deletingCliente) {
        deleteCliente(deletingCliente.id);
        toast.success('Cliente excluído com sucesso!');
        setDeletingCliente(null);
        setIsDeleteModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir cliente');
    }
  };

  const openEditModal = (cliente: any) => {
    setEditingCliente(cliente);
    setIsModalOpen(true);
  };

  const openDetailModal = (cliente: any) => {
    setViewingCliente(cliente);
    setIsDetailModalOpen(true);
  };

  const openDeleteModal = (cliente: any) => {
    setDeletingCliente(cliente);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setViewingCliente(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingCliente(null);
  };

  // Filtro e ordenação estável para clientes
  const filteredClientes = clientes
    .filter(cliente =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cpf.includes(searchTerm) ||
      cliente.telefone.includes(searchTerm)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Clientes</h1>
          <p className="text-muted-foreground">Gerencie todos os seus clientes</p>
        </div>
        <Button 
          className="bg-gradient-primary hover:opacity-90"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-xl font-bold text-primary-dark">{clientes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-success p-2 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-xl font-bold text-success">{clientes.filter(c => c.status === 'ativo').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning p-2 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Novos Este Mês</p>
                <p className="text-xl font-bold text-warning">{clientes.filter(c => {
                  const hoje = new Date();
                  const mesAtual = hoje.getMonth();
                  // Simulação: últimos clientes adicionados são "novos este mês"
                  return parseInt(c.id) > clientes.length - 3;
                }).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
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

      {/* Clients List */}
      <div className="grid gap-4">
        {filteredClientes.map((cliente, index) => (
          <Card key={`cliente-${cliente.id}-${index}`} className="shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-primary-dark">
                        {cliente.nome}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        CPF: {cliente.cpf}
                      </p>
                    </div>
                    <Badge 
                      variant={cliente.status === "ativo" ? "default" : "secondary"}
                      className={cliente.status === "ativo" ? "bg-success text-success-foreground" : ""}
                    >
                      {cliente.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {cliente.telefone}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {cliente.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {cliente.endereco}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      <strong>Nascimento:</strong> {cliente.dataNascimento}
                    </span>
                    <span className="text-primary font-medium">
                      {cliente.contratos} contrato(s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => openDetailModal(cliente)}
                    title="Visualizar detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => openEditModal(cliente)}
                    title="Editar cliente"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => openDeleteModal(cliente)}
                    title="Excluir cliente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClientes.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum cliente encontrado
            </h3>
            <p className="text-sm text-muted-foreground">
              Tente ajustar os filtros de busca ou cadastre um novo cliente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Formulário */}
      <ClienteFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingCliente ? handleEditCliente : handleCreateCliente}
        initialData={editingCliente}
        mode={editingCliente ? 'edit' : 'create'}
      />

      {/* Modal de Detalhes */}
      <ClienteDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        cliente={viewingCliente}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteCliente}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita. O cliente só pode ser excluído se não possuir contratos no sistema."
        itemName={deletingCliente?.nome}
      />
    </div>
  );
}