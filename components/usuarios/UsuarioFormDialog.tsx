'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { RoleGlobal } from '@prisma/client';

interface UsuarioFormData {
  nome: string;
  email: string;
  telefone: string;
  roleGlobal: RoleGlobal;
  senha?: string;
  departamento?: string;
  cargo?: string;
  supervisorId?: string;
}

interface UsuarioFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UsuarioFormData) => Promise<void>;
  usuario?: any;
  usuarios?: any[];
}

const ROLES: { value: RoleGlobal; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'agente', label: 'Agente' },
  { value: 'guia', label: 'Guia' },
  { value: 'motorista', label: 'Motorista' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'cliente', label: 'Cliente' },
];

export default function UsuarioFormDialog({
  isOpen,
  onClose,
  onSubmit,
  usuario,
  usuarios = [],
}: UsuarioFormDialogProps) {
  const [formData, setFormData] = useState<UsuarioFormData>({
    nome: '',
    email: '',
    telefone: '',
    roleGlobal: 'agente',
    senha: '',
    departamento: '',
    cargo: '',
    supervisorId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuario) {
      setFormData({
        nome: usuario.nome || '',
        email: usuario.email || '',
        telefone: usuario.telefone || '',
        roleGlobal: usuario.roleGlobal || 'agente',
        senha: '',
        departamento: usuario.departamento || '',
        cargo: usuario.cargo || '',
        supervisorId: usuario.supervisorId || '',
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        roleGlobal: 'agente',
        senha: '',
        departamento: '',
        cargo: '',
        supervisorId: '',
      });
    }
    setError('');
  }, [usuario, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.nome || !formData.email || !formData.roleGlobal) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!usuario && !formData.senha) {
      setError('Senha é obrigatória para novos usuários');
      return;
    }

    if (formData.senha && formData.senha.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {usuario ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Função *
              </label>
              <select
                value={formData.roleGlobal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roleGlobal: e.target.value as RoleGlobal,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                value={formData.departamento}
                onChange={(e) =>
                  setFormData({ ...formData, departamento: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={formData.cargo}
                onChange={(e) =>
                  setFormData({ ...formData, cargo: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supervisor
              </label>
              <select
                value={formData.supervisorId}
                onChange={(e) =>
                  setFormData({ ...formData, supervisorId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhum</option>
                {usuarios
                  .filter((u) => u.id !== usuario?.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.roleGlobal})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {usuario ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
              </label>
              <input
                type="password"
                value={formData.senha}
                onChange={(e) =>
                  setFormData({ ...formData, senha: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!usuario}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de 6 caracteres
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : usuario ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
