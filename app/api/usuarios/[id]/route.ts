import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { RoleGlobal } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();

    const usuario = await prisma.usuario.findFirst({
      where: {
        id: params.id,
        orgId: session.orgId,
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
        _count: {
          select: {
            osResponsavel: true,
            guiaDesignacoes: true,
            motoristaDesignacoes: true,
            lancamentosCriados: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const {
      nome,
      email,
      telefone,
      roleGlobal,
      senha,
      ativo,
      departamento,
      cargo,
      supervisorId,
      permissoes,
      avatar,
    } = body;

    // Verificar se usuário existe
    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        id: params.id,
        orgId: session.orgId,
      },
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Se email foi alterado, verificar se já existe
    if (email && email !== usuarioExistente.email) {
      const emailExiste = await prisma.usuario.findUnique({
        where: { email },
      });

      if (emailExiste) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        );
      }
    }

    const dataToUpdate: any = {};

    if (nome !== undefined) dataToUpdate.nome = nome;
    if (email !== undefined) dataToUpdate.email = email;
    if (telefone !== undefined) dataToUpdate.telefone = telefone;
    if (roleGlobal !== undefined) dataToUpdate.roleGlobal = roleGlobal as RoleGlobal;
    if (ativo !== undefined) dataToUpdate.ativo = ativo;
    if (departamento !== undefined) dataToUpdate.departamento = departamento;
    if (cargo !== undefined) dataToUpdate.cargo = cargo;
    if (supervisorId !== undefined) {
      // O frontend pode enviar supervisorId como string vazia ao atualizar apenas a senha.
      // Isso causaria violação de FK. Normalizamos:
      // - '' ou null => limpa supervisor (NULL)
      // - string => valida que o supervisor existe na mesma organização
      if (supervisorId === '' || supervisorId === null) {
        dataToUpdate.supervisorId = null;
      } else {
        const supervisorExiste = await prisma.usuario.findFirst({
          where: {
            id: supervisorId,
            orgId: session.orgId,
          },
          select: { id: true },
        });

        if (!supervisorExiste) {
          return NextResponse.json(
            { error: 'Supervisor inválido' },
            { status: 400 }
          );
        }

        dataToUpdate.supervisorId = supervisorId;
      }
    }
    if (permissoes !== undefined) dataToUpdate.permissoes = permissoes;
    if (avatar !== undefined) dataToUpdate.avatar = avatar;

    // Se senha foi fornecida, fazer hash
    if (senha) {
      dataToUpdate.hashSenha = await hashPassword(senha);
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: params.id },
      data: dataToUpdate,
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

    return NextResponse.json(usuarioAtualizado);
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();

    // Verificar se usuário existe
    const usuario = await prisma.usuario.findFirst({
      where: {
        id: params.id,
        orgId: session.orgId,
      },
      include: {
        _count: {
          select: {
            osResponsavel: true,
            guiaDesignacoes: true,
            motoristaDesignacoes: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se usuário tem dependências
    if (
      usuario._count.osResponsavel > 0 ||
      usuario._count.guiaDesignacoes > 0 ||
      usuario._count.motoristaDesignacoes > 0
    ) {
      return NextResponse.json(
        {
          error:
            'Usuário não pode ser excluído pois possui OS, guiamentos ou designações associadas. Desative o usuário ao invés de excluí-lo.',
        },
        { status: 400 }
      );
    }

    await prisma.usuario.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Erro ao excluir usuário' },
      { status: 500 }
    );
  }
}
