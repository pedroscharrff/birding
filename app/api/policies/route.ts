import { NextRequest, NextResponse } from 'next/server'
import { listPolicies, createPolicy } from '@/lib/services/policy'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId')
    if (!orgId) {
      return NextResponse.json({ error: 'orgId é obrigatório' }, { status: 400 })
    }

    const policies = await listPolicies(orgId)
    return NextResponse.json(policies)
  } catch (error) {
    console.error('[API Policies] Erro ao listar:', error)
    return NextResponse.json({ error: 'Erro ao listar políticas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const policy = await createPolicy(body)
    return NextResponse.json(policy, { status: 201 })
  } catch (error) {
    console.error('[API Policies] Erro ao criar:', error)
    return NextResponse.json({ error: 'Erro ao criar política' }, { status: 500 })
  }
}
