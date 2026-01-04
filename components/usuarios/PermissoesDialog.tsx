'use client';

import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import {
  UserPermissions,
  PermissionModule,
  PermissionLevel,
  DEFAULT_PERMISSIONS,
} from '@/types/permissions';
import { RoleGlobal } from '@prisma/client';

interface PermissoesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissoes: UserPermissions) => Promise<void>;
  usuario: {
    id: string;
    nome: string;
    roleGlobal: RoleGlobal;
    permissoes?: UserPermissions | null;
  };
}

const MODULES: { key: PermissionModule; label: string }[] = [
  { key: 'os', label: 'Ordens de Serviço' },
  { key: 'participantes', label: 'Participantes' },
  { key: 'fornecedores', label: 'Fornecedores' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'calendario', label: 'Calendário' },
  { key: 'cotacoes', label: 'Cotações' },
  { key: 'usuarios', label: 'Usuários' },
  { key: 'configuracoes', label: 'Configurações' },
  { key: 'relatorios', label: 'Relatórios' },
];

const LEVELS: { value: PermissionLevel; label: string }[] = [
  { value: 'none', label: 'Nenhum' },
  { value: 'own', label: 'Próprios' },
  { value: 'department', label: 'Departamento' },
  { value: 'all', label: 'Todos' },
];

export default function PermissoesDialog({
  isOpen,
  onClose,
  onSave,
  usuario,
}: PermissoesDialogProps) {
  const [permissoes, setPermissoes] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(false);
  const [useDefaults, setUseDefaults] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const defaultPerms = DEFAULT_PERMISSIONS[usuario.roleGlobal] || {};
      const currentPerms = usuario.permissoes || defaultPerms;
      setPermissoes(currentPerms);
      setUseDefaults(!usuario.permissoes);
    }
  }, [isOpen, usuario]);

  const handleToggleDefaults = () => {
    if (!useDefaults) {
      const defaultPerms = DEFAULT_PERMISSIONS[usuario.roleGlobal] || {};
      setPermissoes(defaultPerms);
      setUseDefaults(true);
    } else {
      setUseDefaults(false);
    }
  };

  const handleUpdatePermission = (
    module: PermissionModule,
    action: 'create' | 'read' | 'update' | 'delete' | 'export',
    value: boolean | PermissionLevel
  ) => {
    setUseDefaults(false);
    setPermissoes((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(permissoes);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold">Gerenciar Permissões</h2>
            <p className="text-sm text-gray-600 mt-1">
              {usuario.nome} - {usuario.roleGlobal}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">
                  Permissões Padrão
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  As permissões padrão são baseadas na função do usuário. Você
                  pode personalizá-las conforme necessário.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDefaults}
                    onChange={handleToggleDefaults}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-blue-900">
                    Usar permissões padrão da função
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {MODULES.map((module) => {
              const modulePerms = permissoes[module.key] || {};
              return (
                <div
                  key={module.key}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-medium text-gray-900 mb-4">
                    {module.label}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Criar
                      </label>
                      <input
                        type="checkbox"
                        checked={modulePerms.create === true}
                        onChange={(e) =>
                          handleUpdatePermission(
                            module.key,
                            'create',
                            e.target.checked
                          )
                        }
                        disabled={useDefaults}
                        className="rounded border-gray-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Visualizar
                      </label>
                      <select
                        value={modulePerms.read || 'none'}
                        onChange={(e) =>
                          handleUpdatePermission(
                            module.key,
                            'read',
                            e.target.value as PermissionLevel
                          )
                        }
                        disabled={useDefaults}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Editar
                      </label>
                      <select
                        value={modulePerms.update || 'none'}
                        onChange={(e) =>
                          handleUpdatePermission(
                            module.key,
                            'update',
                            e.target.value as PermissionLevel
                          )
                        }
                        disabled={useDefaults}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Excluir
                      </label>
                      <select
                        value={modulePerms.delete || 'none'}
                        onChange={(e) =>
                          handleUpdatePermission(
                            module.key,
                            'delete',
                            e.target.value as PermissionLevel
                          )
                        }
                        disabled={useDefaults}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Exportar
                      </label>
                      <input
                        type="checkbox"
                        checked={modulePerms.export === true}
                        onChange={(e) =>
                          handleUpdatePermission(
                            module.key,
                            'export',
                            e.target.checked
                          )
                        }
                        disabled={useDefaults}
                        className="rounded border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
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
              {loading ? 'Salvando...' : 'Salvar Permissões'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
