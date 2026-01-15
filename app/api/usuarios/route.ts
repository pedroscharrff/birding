import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { DEFAULT_PERMISSIONS } from '@/types/permissions';
import { RoleGlobal } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');
    const roleGlobal = searchParams.get('roleGlobal');
    const roles = searchParams.get('roles'); // Suporte para múltiplos roles separados por vírgula
    const departamento = searchParams.get('departamento');
    const search = searchParams.get('search');

    const where: any = {
      orgId: session.orgId,
    };

    if (ativo !== null) {
      where.ativo = ativo === 'true';
    }

    // Suporte para filtro por múltiplos roles
    if (roles) {
      const rolesArray = roles.split(',').map(r => r.trim());
      where.roleGlobal = { in: rolesArray };
    } else if (roleGlobal) {
      where.roleGlobal = roleGlobal;
    }

    if (departamento) {
      where.departamento = departamento;
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        roleGlobal: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            osResponsavel: true,
          },
        },
      },
      orderBy: [
        { ativo: 'desc' },
        { nome: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: usuarios,
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Apenas administradores podem criar usuários
    if (session.roleGlobal !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar usuários' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nome,
      email,
      telefone,
      roleGlobal,
      senha,
      departamento,
      cargo,
      supervisorId,
      permissoes,
    } = body;

    // Validações
    if (!nome || !email || !roleGlobal || !senha) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, email, roleGlobal, senha' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const emailExiste = await prisma.usuario.findUnique({
      where: { email },
    });

    if (emailExiste) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashSenha = await hashPassword(senha);

    // Definir permissões padrão baseadas no role se não fornecidas
    const permissoesFinais = permissoes || DEFAULT_PERMISSIONS[roleGlobal] || {};

    const novoUsuario = await prisma.usuario.create({
      data: {
        orgId: session.orgId,
        nome,
        email,
        telefone,
        roleGlobal: roleGlobal as RoleGlobal,
        hashSenha,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        roleGlobal: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(novoUsuario, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
