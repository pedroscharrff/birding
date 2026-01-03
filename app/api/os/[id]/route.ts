import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { updateOSSchema } from '@/lib/validators/os'
import { invalidateOSStatsCache, refreshMaterializedViews } from '@/lib/services/dashboard-stats'

// GET /api/os/[id] - Obter OS por ID
// Otimizado com selects específicos para reduzir payload
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id } = params

    // Query otimizada com selects específicos ao invés de include completo
    const os = await prisma.oS.findFirst({
      where: {
        id,
        orgId: session.orgId,
      },
      select: {
        id: true,
        orgId: true,
        titulo: true,
        destino: true,
        dataInicio: true,
        dataFim: true,
        status: true,
        agenteResponsavelId: true,
        descricao: true,
        checklist: true,
        createdAt: true,
        updatedAt: true,
        agenteResponsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        participantes: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            passaporteNumero: true,
            passaporteValidade: true,
            alergias: true,
            restricoes: true,
            preferencias: true,
            idade: true,
            observacoes: true,
            documentos: true,
            createdAt: true,
          },
          orderBy: {
            nome: 'asc',
          },
        },
        fornecedores: {
          select: {
            id: true,
            fornecedorId: true,
            categoria: true,
            contatoNome: true,
            contatoEmail: true,
            contatoTelefone: true,
            contratoRef: true,
            fornecedor: {
              select: {
                id: true,
                nomeFantasia: true,
                tipo: true,
                email: true,
                telefone: true,
              },
            },
          },
        },
        atividades: {
          select: {
            id: true,
            nome: true,
            valor: true,
            moeda: true,
            localizacao: true,
            quantidadeMaxima: true,
            data: true,
            hora: true,
            fornecedorId: true,
            notas: true,
            fornecedor: {
              select: {
                id: true,
                nomeFantasia: true,
                tipo: true,
              },
            },
          },
          orderBy: [
            { data: 'asc' },
            { hora: 'asc' },
          ],
        },
        hospedagens: {
          select: {
            id: true,
            fornecedorId: true,
            tarifaId: true,
            hotelNome: true,
            checkin: true,
            checkout: true,
            quartos: true,
            tipoQuarto: true,
            regime: true,
            custoTotal: true,
            moeda: true,
            observacoes: true,
            reservasRefs: true,
            fornecedor: {
              select: {
                id: true,
                nomeFantasia: true,
                tipo: true,
                email: true,
                telefone: true,
              },
            },
          },
          orderBy: {
            checkin: 'asc',
          },
        },
        transportes: {
          select: {
            id: true,
            tipo: true,
            fornecedorId: true,
            origem: true,
            destino: true,
            dataPartida: true,
            dataChegada: true,
            custo: true,
            moeda: true,
            detalhes: true,
            fornecedor: {
              select: {
                id: true,
                nomeFantasia: true,
                tipo: true,
              },
            },
          },
          orderBy: {
            dataPartida: 'asc',
          },
        },
        passagensAereas: {
          select: {
            id: true,
            categoria: true,
            passageiroNome: true,
            cia: true,
            pnr: true,
            trecho: true,
            dataPartida: true,
            dataChegada: true,
            custo: true,
            moeda: true,
          },
          orderBy: {
            dataPartida: 'asc',
          },
        },
        guiasDesignacao: {
          select: {
            id: true,
            guiaId: true,
            funcao: true,
            guia: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
              },
            },
          },
        },
        motoristasDesignacao: {
          select: {
            id: true,
            motoristaId: true,
            veiculoTipo: true,
            motorista: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
              },
            },
          },
        },
        scoutings: {
          select: {
            id: true,
            autorId: true,
            titulo: true,
            descricao: true,
            roteiroJson: true,
            anexos: true,
            createdAt: true,
            updatedAt: true,
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
        anotacoes: {
          select: {
            id: true,
            autorId: true,
            texto: true,
            createdAt: true,
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
          take: 50, // Limitar últimas 50 anotações
        },
        historicoStatus: {
          select: {
            id: true,
            de: true,
            para: true,
            alteradoPor: true,
            motivo: true,
            createdAt: true,
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
          take: 100, // Limitar últimos 100 status
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

    // Invalidar cache de estatísticas
    invalidateOSStatsCache(os.id)

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

    // Invalidar cache de estatísticas
    invalidateOSStatsCache(id)

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
