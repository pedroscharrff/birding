import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { contarGuiasFromData } from '@/lib/utils/guia-detection'
import { differenceInDays } from 'date-fns'

// GET /api/debug/alertas-guias - Debug detalhado de alertas de guias
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const hoje = new Date()

    console.log('=== DEBUG: Análise de Alertas de Guias ===')
    console.log('OrgId:', session.orgId)
    console.log('Data atual:', hoje.toISOString())

    // Buscar todas as OS ativas
    const osList = await prisma.oS.findMany({
      where: {
        orgId: session.orgId,
        status: {
          notIn: ['concluida', 'pos_viagem', 'cancelada'],
        },
      },
      include: {
        guiasDesignacao: {
          select: {
            id: true,
            guiaId: true,
            funcao: true,
            guia: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
        },
        fornecedores: {
          select: {
            id: true,
            categoria: true,
            fornecedor: {
              select: {
                nomeFantasia: true,
                tipo: true,
              },
            },
          },
        },
      },
    })

    console.log(`\n📊 Total de OS ativas: ${osList.length}\n`)

    const analise = osList.map(os => {
      const diasAteInicio = differenceInDays(new Date(os.dataInicio), hoje)

      // Contar guias
      const contadorGuias = contarGuiasFromData({
        guiasDesignacao: os.guiasDesignacao,
        fornecedores: os.fornecedores,
      })

      // Verificar se deve gerar alerta
      const deveGerarAlerta = diasAteInicio <= 15 && diasAteInicio > 0 && contadorGuias.total === 0

      const info = {
        osId: os.id,
        titulo: os.titulo,
        dataInicio: os.dataInicio,
        diasAteInicio,
        status: os.status,

        // Guias internos
        guiasInternos: {
          total: os.guiasDesignacao.length,
          lista: os.guiasDesignacao.map(g => ({
            id: g.id,
            nome: g.guia.nome,
            funcao: g.funcao,
          })),
        },

        // Fornecedores
        fornecedores: {
          total: os.fornecedores.length,
          guiamento: os.fornecedores.filter(f => f.categoria === 'guiamento').map(f => ({
            id: f.id,
            nome: f.fornecedor.nomeFantasia,
            tipo: f.fornecedor.tipo,
            categoria: f.categoria,
          })),
        },

        // Contagem unificada
        totalGuias: contadorGuias,

        // Alerta
        alerta: {
          deveGerar: deveGerarAlerta,
          motivo: deveGerarAlerta
            ? `Inicia em ${diasAteInicio} dias e não tem guia`
            : diasAteInicio > 15
              ? `Ainda faltam ${diasAteInicio} dias (alerta só < 15 dias)`
              : diasAteInicio <= 0
                ? 'Já passou da data de início'
                : 'Tem guia designado',
        },
      }

      console.log('\n---')
      console.log(`OS: ${info.titulo}`)
      console.log(`  Inicia em: ${diasAteInicio} dias`)
      console.log(`  Guias internos: ${info.guiasInternos.total}`)
      console.log(`  Fornecedores guiamento: ${info.fornecedores.guiamento.length}`)
      console.log(`  Total de guias: ${contadorGuias.total}`)
      console.log(`  Deve gerar alerta? ${deveGerarAlerta ? '❌ SIM' : '✅ NÃO'}`)
      console.log(`  Motivo: ${info.alerta.motivo}`)

      return info
    })

    // Resumo
    const resumo = {
      totalOS: osList.length,
      osComGuias: analise.filter(a => a.totalGuias.total > 0).length,
      osSemGuias: analise.filter(a => a.totalGuias.total === 0).length,
      osComAlerta: analise.filter(a => a.alerta.deveGerar).length,
    }

    console.log('\n=== RESUMO ===')
    console.log(`Total OS: ${resumo.totalOS}`)
    console.log(`Com guias: ${resumo.osComGuias}`)
    console.log(`Sem guias: ${resumo.osSemGuias}`)
    console.log(`Devem gerar alerta: ${resumo.osComAlerta}`)

    return NextResponse.json({
      success: true,
      data: {
        resumo,
        detalhes: analise,
        explicacao: {
          criterios: {
            prazo: 'OS deve iniciar em <= 15 dias e > 0 dias',
            guias: 'Total de guias (internos + fornecedores) deve ser 0',
          },
          comoResolver: [
            '1. Adicione guia interno na aba "Guias" da OS',
            '2. OU adicione fornecedor tipo "Guiamento" à OS',
            '3. Aguarde 1-2 segundos e recarregue',
            '4. Se persistir, execute POST /api/debug/cache para limpar cache',
          ],
        },
      },
    })
  } catch (error: any) {
    console.error('Debug alertas-guias error:', error)

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
