import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'

// GET /api/fornecedores - Listar fornecedores
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)

    const tipo = searchParams.get('tipo')
    const search = searchParams.get('search')

    // Construir filtros
    const where: any = {
      orgId: session.orgId,
    }

    if (tipo) {
      where.tipo = tipo
    }

    if (search) {
      where.OR = [
        {
          nomeFantasia: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          razaoSocial: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Buscar fornecedores
    const fornecedores = await prisma.fornecedor.findMany({
      where,
      orderBy: {
        nomeFantasia: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: fornecedores,
    })
  } catch (error: any) {
    console.error('List fornecedores error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao listar fornecedores' },
      { status: 500 }
    )
  }
}

// POST /api/fornecedores - Criar fornecedor
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const { nomeFantasia, razaoSocial, tipo, email, telefone, documento, endereco, obs, arquivos } = body

    if (!nomeFantasia || !tipo) {
      return NextResponse.json(
        { success: false, error: 'Nome fantasia e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    const fornecedor = await prisma.fornecedor.create({
      data: {
        orgId: session.orgId,
        nomeFantasia,
        razaoSocial: razaoSocial || null,
        tipo,
        email: email || null,
        telefone: telefone || null,
        documento: documento || null,
        endereco: endereco || null,
        obs: obs || null,
        arquivos: arquivos || null,
      },
    })

    // Revalidar cache para atualizar listas de fornecedores
    revalidatePath('/dashboard/fornecedores')

    return NextResponse.json({
      success: true,
      data: fornecedor,
    })
  } catch (error: any) {
    console.error('Create fornecedor error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao criar fornecedor' },
      { status: 500 }
    )
  }
}
