'use client';

import { useState } from 'react';
import { Pencil, Trash2, UserCheck, UserX, Shield } from 'lucide-react';
import { RoleGlobal } from '@prisma/client';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  roleGlobal: RoleGlobal;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    osResponsavel: number;
  };
}

interface UsuariosTableProps {
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, ativo: boolean) => void;
  onManagePermissions: (usuario: Usuario) => void;
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

export default function UsuariosTable({
  usuarios,
  onEdit,
  onDelete,
  onToggleStatus,
  onManagePermissions,
}: UsuariosTableProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
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
              Telefone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Função
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              OS Responsável
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
          {usuarios.map((usuario) => (
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
                <div className="text-sm text-gray-500">
                  {usuario.telefone || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    ROLE_COLORS[usuario.roleGlobal]
                  }`}
                >
                  {ROLE_LABELS[usuario.roleGlobal]}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {usuario._count.osResponsavel}
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
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onManagePermissions(usuario)}
                    className="text-purple-600 hover:text-purple-900"
                    title="Gerenciar Permissões"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onToggleStatus(usuario.id, !usuario.ativo)}
                    className={`${
                      usuario.ativo
                        ? 'text-orange-600 hover:text-orange-900'
                        : 'text-green-600 hover:text-green-900'
                    }`}
                    title={usuario.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {usuario.ativo ? (
                      <UserX className="h-4 w-4" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onEdit(usuario)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(usuario.id)}
                    className={`${
                      confirmDelete === usuario.id
                        ? 'text-red-900 font-bold'
                        : 'text-red-600 hover:text-red-900'
                    }`}
                    title={
                      confirmDelete === usuario.id
                        ? 'Clique novamente para confirmar'
                        : 'Excluir'
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {usuarios.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhum usuário encontrado
        </div>
      )}
    </div>
  );
}
