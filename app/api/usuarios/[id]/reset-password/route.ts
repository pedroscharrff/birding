import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();

    if (session.roleGlobal !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem redefinir senhas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { senha } = validation.data;

    const usuario = await prisma.usuario.findFirst({
      where: {
        id: params.id,
        orgId: session.orgId,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const hashSenha = await hashPassword(senha);

    await prisma.usuario.update({
      where: { id: params.id },
      data: { hashSenha },
    });

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error);
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Erro ao redefinir senha' },
      { status: 500 }
    );
  }
}
