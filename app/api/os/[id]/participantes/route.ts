import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { createParticipanteSchema } from '@/lib/validators/participante'

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
      data: {
        ...validatedData,
        ...(validatedData.passaporteValidade && {
          passaporteValidade: new Date(validatedData.passaporteValidade),
        }),
      },
    })
    
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
