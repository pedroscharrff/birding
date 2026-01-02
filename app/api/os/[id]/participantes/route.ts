import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { createParticipanteSchema } from '@/lib/validators/participante'
import { logAuditoria } from '@/lib/services/auditoria'

// POST /api/os/[id]/participantes - Adicionar participante
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId } = params
    const body = await request.json()
    
    // Validar entrada
    const validatedData = createParticipanteSchema.parse({
      ...body,
      osId,
    })

    // Normalizar campos opcionais que podem chegar como string vazia
    const { passaporteValidade, ...rest } = validatedData as any
    const dataToCreate: any = { ...rest }
    if (typeof passaporteValidade === 'string' && passaporteValidade.trim() === '') {
      // não setar campo se veio vazio
    } else if (passaporteValidade) {
      dataToCreate.passaporteValidade = new Date(passaporteValidade)
    }
    
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
    
    // Criar participante
    const participante = await prisma.participante.create({
      data: dataToCreate,
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'criar',
        entidade: 'participante',
        entidadeId: participante.id,
        dadosNovos: participante,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
      // Não falha a operação se auditoria falhar
    }

    return NextResponse.json(
      {
        success: true,
        data: participante,
        message: 'Participante adicionado com sucesso',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create participante error:', error)
    
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
      { success: false, error: 'Erro ao adicionar participante' },
      { status: 500 }
    )
  }
}
