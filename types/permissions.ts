export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'export';

export type PermissionModule = 
  | 'os'
  | 'participantes'
  | 'fornecedores'
  | 'financeiro'
  | 'calendario'
  | 'cotacoes'
  | 'usuarios'
  | 'configuracoes'
  | 'relatorios';

export type PermissionLevel = 'none' | 'own' | 'department' | 'all';
export type PermissionLevelOrNone = PermissionLevel;

export interface ModulePermissions {
  create?: boolean;
  read?: PermissionLevelOrNone;
  update?: PermissionLevelOrNone;
  delete?: PermissionLevelOrNone;
  export?: boolean;
}

export interface UserPermissions {
  os?: ModulePermissions;
  participantes?: ModulePermissions;
  fornecedores?: ModulePermissions;
  financeiro?: ModulePermissions;
  calendario?: ModulePermissions;
  cotacoes?: ModulePermissions;
  usuarios?: ModulePermissions;
  configuracoes?: ModulePermissions;
  relatorios?: ModulePermissions;
}

export const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    os: { create: true, read: 'all', update: 'all', delete: 'all', export: true },
    participantes: { create: true, read: 'all', update: 'all', delete: 'all', export: true },
    fornecedores: { create: true, read: 'all', update: 'all', delete: 'all', export: true },
    financeiro: { create: true, read: 'all', update: 'all', delete: 'all', export: true },
    calendario: { create: true, read: 'all', update: 'all', delete: 'all', export: true },
    cotacoes: { create: true, read: 'all', update: 'all', delete: 'all', export: true },
    usuarios: { create: true, read: 'all', update: 'all', delete: 'all', export: true },
    configuracoes: { create: true, read: 'all', update: 'all', delete: 'all', export: true },
    relatorios: { create: true, read: 'all', update: 'all', delete: 'all', export: true },
  },
  agente: {
    os: { create: true, read: 'all', update: 'own', delete: 'none', export: true },
    participantes: { create: true, read: 'all', update: 'own', delete: 'none', export: true },
    fornecedores: { create: false, read: 'all', update: 'none', delete: 'none', export: false },
    financeiro: { create: true, read: 'own', update: 'own', delete: 'none', export: false },
    calendario: { create: true, read: 'all', update: 'own', delete: 'own', export: true },
    cotacoes: { create: true, read: 'all', update: 'own', delete: 'own', export: true },
    usuarios: { create: false, read: 'all', update: 'none', delete: 'none', export: false },
    configuracoes: { create: false, read: 'all', update: 'none', delete: 'none', export: false },
    relatorios: { create: false, read: 'own', update: 'none', delete: 'none', export: true },
  },
  guia: {
    os: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    participantes: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    fornecedores: { create: false, read: 'all', update: 'none', delete: 'none', export: false },
    financeiro: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    calendario: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    cotacoes: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    usuarios: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    configuracoes: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    relatorios: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
  },
  motorista: {
    os: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    participantes: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    fornecedores: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    financeiro: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    calendario: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    cotacoes: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    usuarios: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    configuracoes: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    relatorios: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
  },
  fornecedor: {
    os: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    participantes: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    fornecedores: { create: false, read: 'own', update: 'own', delete: 'none', export: false },
    financeiro: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    calendario: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    cotacoes: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    usuarios: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    configuracoes: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    relatorios: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
  },
  cliente: {
    os: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    participantes: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    fornecedores: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    financeiro: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    calendario: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    cotacoes: { create: false, read: 'own', update: 'none', delete: 'none', export: false },
    usuarios: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    configuracoes: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
    relatorios: { create: false, read: 'none', update: 'none', delete: 'none', export: false },
  },
};

export function hasPermission(
  userPermissions: UserPermissions | null,
  module: PermissionModule,
  action: PermissionAction,
  level?: PermissionLevel
): boolean {
  if (!userPermissions || !userPermissions[module]) {
    return false;
  }

  const modulePerms = userPermissions[module];

  if (action === 'create' || action === 'export') {
    return modulePerms[action] === true;
  }

  const permLevel = modulePerms[action] as PermissionLevel | undefined;
  if (!permLevel) {
    return false;
  }
  
  if (permLevel === 'none') {
    return false;
  }

  if (level) {
    const levels: PermissionLevel[] = ['none', 'own', 'department', 'all'];
    const userLevelIndex = levels.indexOf(permLevel);
    const requiredLevelIndex = levels.indexOf(level);
    return userLevelIndex >= requiredLevelIndex;
  }

  return true;
}
