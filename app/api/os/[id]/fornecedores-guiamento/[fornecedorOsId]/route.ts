import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { logAuditoria } from '@/lib/services/auditoria'
import { alertsCache } from '@/lib/cache/alerts-cache'

// PATCH /api/os/[id]/fornecedores-guiamento/[fornecedorOsId] - Atualizar informações de contato
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; fornecedorOsId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, fornecedorOsId } = params
    const body = await request.json()

    const { contatoNome, contatoEmail, contatoTelefone, contratoRef } = body

    // Verificar se OS existe e pertence à organização
    const os = await prisma.oS.findFirst({
      where: {
        id: osId,
        orgId: session.orgId,
      },
    })

    if (!os) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    // Buscar vínculo existente
    const vinculoExistente = await prisma.oSFornecedor.findFirst({
      where: {
        id: fornecedorOsId,
        osId,
        categoria: 'guiamento',
      },
      include: {
        fornecedor: true,
      },
    })

    if (!vinculoExistente) {
      return NextResponse.json(
        { success: false, error: 'Vínculo não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar vínculo
    const vinculoAtualizado = await prisma.oSFornecedor.update({
      where: { id: fornecedorOsId },
      data: {
        contatoNome: contatoNome || null,
        contatoEmail: contatoEmail || null,
        contatoTelefone: contatoTelefone || null,
        contratoRef: contratoRef || null,
      },
      include: {
        fornecedor: {
          select: {
            id: true,
            nomeFantasia: true,
            razaoSocial: true,
            tipo: true,
            email: true,
            telefone: true,
          },
        },
      },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'atualizar',
        entidade: 'fornecedor_os',
        entidadeId: vinculoAtualizado.id,
        dadosAntigos: {
          contatoNome: vinculoExistente.contatoNome,
          contatoEmail: vinculoExistente.contatoEmail,
          contatoTelefone: vinculoExistente.contatoTelefone,
          contratoRef: vinculoExistente.contratoRef,
        },
        dadosNovos: {
          contatoNome: vinculoAtualizado.contatoNome,
          contatoEmail: vinculoAtualizado.contatoEmail,
          contatoTelefone: vinculoAtualizado.contatoTelefone,
          contratoRef: vinculoAtualizado.contratoRef,
        },
        descricao: `Informações de contato do fornecedor ${vinculoExistente.fornecedor.nomeFantasia} atualizadas`,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    return NextResponse.json({
      success: true,
      data: vinculoAtualizado,
      message: 'Informações atualizadas com sucesso',
    })
  } catch (error: any) {
    console.error('Update fornecedor guiamento error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar fornecedor de guiamento' },
      { status: 500 }
    )
  }
}

// DELETE /api/os/[id]/fornecedores-guiamento/[fornecedorOsId] - Remover fornecedor de guiamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fornecedorOsId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, fornecedorOsId } = params

    // Verificar se OS existe e pertence à organização
    const os = await prisma.oS.findFirst({
      where: {
        id: osId,
        orgId: session.orgId,
      },
    })

    if (!os) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    // Buscar vínculo existente
    const vinculo = await prisma.oSFornecedor.findFirst({
      where: {
        id: fornecedorOsId,
        osId,
        categoria: 'guiamento',
      },
      include: {
        fornecedor: true,
      },
    })

    if (!vinculo) {
      return NextResponse.json(
        { success: false, error: 'Vínculo não encontrado' },
        { status: 404 }
      )
    }

    // Deletar vínculo
    await prisma.oSFornecedor.delete({
      where: { id: fornecedorOsId },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'excluir',
        entidade: 'fornecedor_os',
        entidadeId: fornecedorOsId,
        dadosAntigos: {
          fornecedorId: vinculo.fornecedorId,
          fornecedorNome: vinculo.fornecedor.nomeFantasia,
          categoria: 'guiamento',
          contatoNome: vinculo.contatoNome,
          contatoEmail: vinculo.contatoEmail,
          contatoTelefone: vinculo.contatoTelefone,
        },
        descricao: `Fornecedor de guiamento ${vinculo.fornecedor.nomeFantasia} removido da OS`,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    // Invalidar cache de alertas
    alertsCache.invalidate(session.orgId)
    console.log('[Cache] Cache de alertas invalidado após remover fornecedor de guiamento')

    return NextResponse.json({
      success: true,
      message: 'Fornecedor de guiamento removido com sucesso',
    })
  } catch (error: any) {
    console.error('Delete fornecedor guiamento error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao remover fornecedor de guiamento' },
      { status: 500 }
    )
  }
}
