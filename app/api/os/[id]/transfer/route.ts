import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { invalidateOSStatsCache } from '@/lib/services/dashboard-stats'

const transferSchema = z.object({
  novoAgenteResponsavelId: z.string().uuid('ID do agente inválido'),
})

// POST /api/os/[id]/transfer - Transferir responsável da OS
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id } = params
    const body = await request.json()
    
    // Validar entrada
    const { novoAgenteResponsavelId } = transferSchema.parse(body)
    
    // Verificar se OS existe e pertence à organização
    const existingOS = await prisma.oS.findFirst({
      where: {
        id,
        orgId: session.orgId,
      },
      include: {
        agenteResponsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })
    
    if (!existingOS) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se o novo agente existe e pertence à mesma organização
    const novoAgente = await prisma.usuario.findFirst({
      where: {
        id: novoAgenteResponsavelId,
        orgId: session.orgId,
        ativo: true,
        roleGlobal: {
          in: ['admin', 'agente'],
        },
      },
      select: {
        id: true,
        nome: true,
        email: true,
        roleGlobal: true,
      },
    })
    
    if (!novoAgente) {
      return NextResponse.json(
        { success: false, error: 'Agente não encontrado ou inválido' },
        { status: 404 }
      )
    }
    
    // Verificar se está tentando transferir para o mesmo agente
    if (existingOS.agenteResponsavelId === novoAgenteResponsavelId) {
      return NextResponse.json(
        { success: false, error: 'O agente selecionado já é o responsável atual' },
        { status: 400 }
      )
    }
    
    // Atualizar o responsável
    const os = await prisma.oS.update({
      where: { id },
      data: {
        agenteResponsavelId: novoAgenteResponsavelId,
      },
      include: {
        agenteResponsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })
    
    // Buscar dados do usuário que está fazendo a transferência
    const usuarioAtual = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: {
        nome: true,
        roleGlobal: true,
      },
    })
    
    // Registrar a transferência na auditoria
    if (usuarioAtual) {
      await prisma.auditoriaOS.create({
        data: {
          orgId: session.orgId,
          osId: id,
          usuarioId: session.userId,
          usuarioNome: usuarioAtual.nome,
          usuarioRole: usuarioAtual.roleGlobal,
          acao: 'atualizar',
          entidade: 'os',
          entidadeId: id,
          dadosAntigos: {
            agenteResponsavelId: existingOS.agenteResponsavelId,
            agenteResponsavelNome: existingOS.agenteResponsavel.nome,
          },
          dadosNovos: {
            agenteResponsavelId: novoAgente.id,
            agenteResponsavelNome: novoAgente.nome,
          },
          campos: ['agenteResponsavelId'],
          descricao: `Responsável transferido de ${existingOS.agenteResponsavel.nome} para ${novoAgente.nome}`,
        },
      })
    }
    
    // Criar anotação automática sobre a transferência
    await prisma.anotacao.create({
      data: {
        osId: id,
        autorId: session.userId,
        texto: `🔄 Tour transferido de ${existingOS.agenteResponsavel.nome} para ${novoAgente.nome}`,
      },
    })
    
    // Invalidar cache de estatísticas
    invalidateOSStatsCache(id)
    
    // Revalidar cache para atualizar dados da OS
    revalidatePath(`/dashboard/os/${id}`)
    revalidatePath('/dashboard/os')
    revalidatePath('/dashboard')
    
    return NextResponse.json({
      success: true,
      data: os,
      message: `Tour transferido com sucesso para ${novoAgente.nome}`,
    })
  } catch (error: any) {
    console.error('Transfer OS error:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro ao transferir tour' },
      { status: 500 }
    )
  }
}
