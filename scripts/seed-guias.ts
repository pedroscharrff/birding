/**
 * Script para criar usuários guias de exemplo
 *
 * Execute com: npx tsx scripts/seed-guias.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de guias...')

  // Buscar primeira organização
  const org = await prisma.organizacao.findFirst()

  if (!org) {
    console.error('❌ Nenhuma organização encontrada!')
    console.log('💡 Crie uma organização primeiro antes de executar este seed.')
    return
  }

  console.log(`✅ Organização encontrada: ${org.nome} (${org.id})`)

  // Guias de exemplo
  const guias = [
    {
      nome: 'João Silva',
      email: 'joao.guia@birding.com',
      telefone: '+55 11 98765-1111',
    },
    {
      nome: 'Maria Santos',
      email: 'maria.guia@birding.com',
      telefone: '+55 11 98765-2222',
    },
    {
      nome: 'Carlos Oliveira',
      email: 'carlos.guia@birding.com',
      telefone: '+55 11 98765-3333',
    },
    {
      nome: 'Ana Costa',
      email: 'ana.guia@birding.com',
      telefone: '+55 11 98765-4444',
    },
  ]

  const senha = await bcrypt.hash('senha123', 10)

  for (const guiaData of guias) {
    // Verificar se já existe
    const existente = await prisma.usuario.findUnique({
      where: { email: guiaData.email },
    })

    if (existente) {
      console.log(`⏭️  Guia já existe: ${guiaData.nome} (${guiaData.email})`)
      continue
    }

    // Criar guia
    const guia = await prisma.usuario.create({
      data: {
        orgId: org.id,
        nome: guiaData.nome,
        email: guiaData.email,
        telefone: guiaData.telefone,
        roleGlobal: 'guia',
        hashSenha: senha,
        ativo: true,
      },
    })

    console.log(`✅ Guia criado: ${guia.nome} (${guia.email})`)
  }

  console.log('\n🎉 Seed de guias concluído!')
  console.log('\n📋 Credenciais de acesso:')
  console.log('   Email: [email do guia]')
  console.log('   Senha: senha123')
  console.log('\n💡 Os guias agora aparecerão no seletor ao adicionar guias a uma OS.')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
