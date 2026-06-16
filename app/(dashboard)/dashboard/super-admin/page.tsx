'use client';

import { useState, useEffect } from 'react';
import { Search, KeyRound, Shield, AlertTriangle } from 'lucide-react';
import { RoleGlobal } from '@prisma/client';
import { useAuth } from '@/app/providers/AuthProvider';
import ResetSenhaDialog from '@/components/usuarios/ResetSenhaDialog';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  roleGlobal: RoleGlobal;
  ativo: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<RoleGlobal, string> = {
  admin: 'Administrador',
  agente: 'Agente',
  guia: 'Guia',
  motorista: 'Motorista',
  fornecedor: 'Fornecedor',
  cliente: 'Cliente',
};

const ROLE_COLORS: Record<RoleGlobal, string> = {
  admin: 'bg-purple-100 text-purple-800',
  agente: 'bg-blue-100 text-blue-800',
  guia: 'bg-green-100 text-green-800',
  motorista: 'bg-yellow-100 text-yellow-800',
  fornecedor: 'bg-orange-100 text-orange-800',
  cliente: 'bg-gray-100 text-gray-800',
};

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<{ id: string; nome: string; email: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    filterUsuarios();
  }, [usuarios, searchTerm]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('Erro ao buscar usuários');
      const result = await response.json();
      setUsuarios(result.data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsuarios = () => {
    if (!searchTerm) {
      setFilteredUsuarios(usuarios);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFilteredUsuarios(
      usuarios.filter(
        (u) =>
          u.nome.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      )
    );
  };

  const handleResetPassword = (usuario: Usuario) => {
    setSelectedUsuario({ id: usuario.id, nome: usuario.nome, email: usuario.email });
    setResetDialogOpen(true);
  };

  const handlePasswordResetSuccess = () => {
    setSuccessMessage('Senha redefinida com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (!user || user.roleGlobal !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Acesso restrito</p>
          <p className="text-gray-500 text-sm mt-1">
            Apenas administradores podem acessar esta página
          </p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Super Admin
            </h1>
          </div>
          <p className="text-gray-600 mt-1">
            Gerencie senhas de todos os usuários cadastrados
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
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
            <span className="text-sm text-gray-600">
              {filteredUsuarios.length} usuários
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsuarios.map((usuario) => (
                <tr
                  key={usuario.id}
                  className={`hover:bg-gray-50 ${!usuario.ativo ? 'opacity-60' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {usuario.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {usuario.nome}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{usuario.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ROLE_COLORS[usuario.roleGlobal]}`}
                    >
                      {ROLE_LABELS[usuario.roleGlobal]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        usuario.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleResetPassword(usuario)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                      title="Redefinir senha"
                    >
                      <KeyRound className="h-4 w-4" />
                      <span className="text-xs font-medium">Redefinir Senha</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsuarios.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
      </div>

      {selectedUsuario && (
        <ResetSenhaDialog
          isOpen={resetDialogOpen}
          onClose={() => {
            setResetDialogOpen(false);
            setSelectedUsuario(null);
          }}
          usuario={selectedUsuario}
          onSuccess={handlePasswordResetSuccess}
        />
      )}
    </div>
  );
}
