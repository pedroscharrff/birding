import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { converterCotacaoParaOS } from "@/lib/cotacao-converter"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { orgId, userId } = session
    const cotacaoId = params.id

    const body = await req.json()
    const cotacaoData = body.cotacao

    if (!cotacaoData) {
      return NextResponse.json(
        { error: "Dados da cotação são obrigatórios" },
        { status: 400 }
      )
    }

    const result = await converterCotacaoParaOS(prisma, {
      orgId,
      agenteResponsavelId: userId,
      cotacao: cotacaoData,
    })

    return NextResponse.json({
      success: true,
      osId: result.osId,
      participanteId: result.participanteId,
      hospedagensIds: result.hospedagensIds,
      atividadesIds: result.atividadesIds,
      transportesIds: result.transportesIds,
      warnings: result.warnings,
      message: `OS criada com sucesso! ${result.warnings.length > 0 ? `${result.warnings.length} avisos encontrados.` : ''}`,
    })
  } catch (error: any) {
    console.error("Erro ao converter cotação para OS:", error)
    return NextResponse.json(
      { 
        error: "Erro ao converter cotação para OS",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
