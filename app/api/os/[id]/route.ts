import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { updateOSSchema } from '@/lib/validators/os'

// GET /api/os/[id] - Obter OS por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id } = params
    
    const os = await prisma.oS.findFirst({
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
        participantes: true,
        fornecedores: {
          include: {
            fornecedor: true,
          },
        },
        atividades: {
          include: {
            fornecedor: true,
          },
        },
        hospedagens: {
          include: {
            fornecedor: true,
          },
        },
        transportes: {
          include: {
            fornecedor: true,
          },
        },
        passagensAereas: true,
        guiasDesignacao: {
          include: {
            guia: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
        motoristasDesignacao: {
          include: {
            motorista: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
        scoutings: {
          include: {
            autor: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        anotacoes: {
          include: {
            autor: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        historicoStatus: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
    
    if (!os) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: os,
    })
  } catch (error: any) {
    console.error('Get OS error:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro ao obter OS' },
      { status: 500 }
    )
  }
}

// PATCH /api/os/[id] - Atualizar OS
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id } = params
    const body = await request.json()
    
    // Validar entrada
    const validatedData = updateOSSchema.parse(body)
    
    // Verificar se OS existe e pertence à organização
    const existingOS = await prisma.oS.findFirst({
      where: {
        id,
        orgId: session.orgId,
      },
    })
    
    if (!existingOS) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }
    
    // Atualizar OS
    const os = await prisma.oS.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.dataInicio && { dataInicio: new Date(validatedData.dataInicio) }),
        ...(validatedData.dataFim && { dataFim: new Date(validatedData.dataFim) }),
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
    
    // Se o status mudou, registrar no histórico
    if (validatedData.status && validatedData.status !== existingOS.status) {
      await prisma.historicoStatus.create({
        data: {
          osId: os.id,
          de: existingOS.status,
          para: validatedData.status,
          alteradoPor: session.userId,
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      data: os,
      message: 'OS atualizada com sucesso',
    })
  } catch (error: any) {
    console.error('Update OS error:', error)
    
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
      { success: false, error: 'Erro ao atualizar OS' },
      { status: 500 }
    )
  }
}

// DELETE /api/os/[id] - Deletar OS
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id } = params
    
    // Verificar se OS existe e pertence à organização
    const existingOS = await prisma.oS.findFirst({
      where: {
        id,
        orgId: session.orgId,
      },
    })
    
    if (!existingOS) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }
    
    // Deletar OS (cascade vai deletar relacionamentos)
    await prisma.oS.delete({
      where: { id },
    })
    
    return NextResponse.json({
      success: true,
      message: 'OS deletada com sucesso',
    })
  } catch (error: any) {
    console.error('Delete OS error:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar OS' },
      { status: 500 }
    )
  }
}
