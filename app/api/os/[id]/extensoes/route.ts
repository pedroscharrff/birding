import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { z } from 'zod'

// Schema de validação
const createExtensionSchema = z.object({
  nome: z.string().min(3),
  dataInicio: z.string(),
  dataFim: z.string(),
  descricao: z.string().optional(),
  status: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: osId } = params

    const extensoes = await prisma.oSExtensao.findMany({
      where: {
        osId: osId
      },
      orderBy: {
        dataInicio: 'asc'
      }
    })

    return NextResponse.json(extensoes)
  } catch (error) {
    console.error('Erro ao buscar extensões:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar extensões' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: osId } = params
    const body = await request.json()
    const data = createExtensionSchema.parse(body)

    const extensao = await prisma.oSExtensao.create({
      data: {
        osId,
        nome: data.nome,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        descricao: data.descricao,
        status: data.status ? (data.status as any) : undefined,
      }
    })

    // Audit Log
    // Como session.name não existe em todas as implementações JWT customizadas, 
    // buscamos o nome ou usamos fallback. 
    // O payload do JWT em lib/auth/session só expõe userId, orgId, roleGlobal (ver session.ts).
    // Vou usar 'Usuário' como fallback ou melhor, buscar o usuário se crítico, mas para performance usamos o ID.
    
    await prisma.auditoriaOS.create({
      data: {
        orgId: session.orgId,
        osId,
        usuarioId: session.userId,
        usuarioNome: 'Usuário', // TODO: Melhorar obtendo nome do usuário se necessário
        usuarioRole: session.roleGlobal as any, // Cast para o Enum se necessário
        acao: 'criar',
        entidade: 'extensao',
        entidadeId: extensao.id,
        dadosNovos: extensao as any,
        descricao: `Criou extensão: ${extensao.nome}`
      }
    })

    // Registrar histórico inicial de status
    if (extensao.status) {
      await prisma.historicoStatus.create({
        data: {
          osId,
          extensaoId: extensao.id,
          de: undefined,
          para: extensao.status,
          alteradoPor: session.userId,
          motivo: 'Criação da extensão'
        }
      })
    }

    return NextResponse.json(extensao)
  } catch (error) {
    console.error('Erro ao criar extensão:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Erro ao criar extensão' },
      { status: 500 }
    )
  }
}
