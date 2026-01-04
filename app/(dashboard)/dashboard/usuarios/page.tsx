'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Search, Filter, Download } from 'lucide-react';
import UsuariosTable from '@/components/usuarios/UsuariosTable';
import UsuarioFormDialog from '@/components/usuarios/UsuarioFormDialog';
import PermissoesDialog from '@/components/usuarios/PermissoesDialog';
import { RoleGlobal } from '@prisma/client';
import { UserPermissions } from '@/types/permissions';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  roleGlobal: RoleGlobal;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  permissoes?: UserPermissions | null;
  _count: {
    osResponsavel: number;
  };
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    filterUsuarios();
  }, [usuarios, searchTerm, filterRole, filterStatus]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('Erro ao buscar usuários');
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const filterUsuarios = () => {
    let filtered = [...usuarios];

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole) {
      filtered = filtered.filter((u) => u.roleGlobal === filterRole);
    }

    if (filterStatus === 'ativo') {
      filtered = filtered.filter((u) => u.ativo);
    } else if (filterStatus === 'inativo') {
      filtered = filtered.filter((u) => !u.ativo);
    }

    setFilteredUsuarios(filtered);
  };

  const handleCreateUsuario = async (data: any) => {
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar usuário');
      }

      await fetchUsuarios();
      setShowForm(false);
    } catch (error: any) {
      throw error;
    }
  };

  const handleUpdateUsuario = async (data: any) => {
    if (!selectedUsuario) return;

    try {
      const response = await fetch(`/api/usuarios/${selectedUsuario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar usuário');
      }

      await fetchUsuarios();
      setShowForm(false);
      setSelectedUsuario(null);
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteUsuario = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir usuário');
      }

      await fetchUsuarios();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleToggleStatus = async (id: string, ativo: boolean) => {
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      await fetchUsuarios();
    } catch (error) {
      alert('Erro ao atualizar status do usuário');
    }
  };

  const handleSavePermissions = async (permissoes: UserPermissions) => {
    if (!selectedUsuario) return;

    try {
      const response = await fetch(`/api/usuarios/${selectedUsuario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissoes }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar permissões');
      }

      await fetchUsuarios();
      setShowPermissions(false);
      setSelectedUsuario(null);
    } catch (error) {
      alert('Erro ao salvar permissões');
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowForm(true);
  };

  const handleManagePermissions = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowPermissions(true);
  };

  const handleExport = () => {
    const csv = [
      ['Nome', 'Email', 'Telefone', 'Função', 'Status', 'OS Responsável'].join(
        ','
      ),
      ...filteredUsuarios.map((u) =>
        [
          u.nome,
          u.email,
          u.telefone || '',
          u.roleGlobal,
          u.ativo ? 'Ativo' : 'Inativo',
          u._count.osResponsavel,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gerenciamento de Usuários
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie usuários, funções e permissões do sistema
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedUsuario(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="h-5 w-5" />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as Funções</option>
                <option value="admin">Administrador</option>
                <option value="agente">Agente</option>
                <option value="guia">Guia</option>
                <option value="motorista">Motorista</option>
                <option value="fornecedor">Fornecedor</option>
                <option value="cliente">Cliente</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os Status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Exportar CSV"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <span>
              Total: <strong>{filteredUsuarios.length}</strong> usuários
            </span>
            <span>
              Ativos:{' '}
              <strong>
                {filteredUsuarios.filter((u) => u.ativo).length}
              </strong>
            </span>
            <span>
              Inativos:{' '}
              <strong>
                {filteredUsuarios.filter((u) => !u.ativo).length}
              </strong>
            </span>
          </div>
        </div>

        <UsuariosTable
          usuarios={filteredUsuarios}
          onEdit={handleEdit}
          onDelete={handleDeleteUsuario}
          onToggleStatus={handleToggleStatus}
          onManagePermissions={handleManagePermissions}
        />
      </div>

      <UsuarioFormDialog
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedUsuario(null);
        }}
        onSubmit={selectedUsuario ? handleUpdateUsuario : handleCreateUsuario}
        usuario={selectedUsuario}
        usuarios={usuarios}
      />

      {selectedUsuario && (
        <PermissoesDialog
          isOpen={showPermissions}
          onClose={() => {
            setShowPermissions(false);
            setSelectedUsuario(null);
          }}
          onSave={handleSavePermissions}
          usuario={selectedUsuario}
        />
      )}
    </div>
  );
}
