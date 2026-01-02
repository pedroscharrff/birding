import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/auth/password'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Criar/obter organização padrão
  const orgNome = 'Birding Tours'
  let org = await prisma.organizacao.findFirst({ where: { nome: orgNome } })
  if (!org) {
    org = await prisma.organizacao.create({
      data: {
        nome: orgNome,
      },
    })
    console.log('✅ Organização criada')
  }

  // Criar usuário admin
  const adminEmail = 'admin@birding.local'
  const adminSenha = 'admin123'
  const adminHash = await hashPassword(adminSenha)

  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      nome: 'Administrador',
      hashSenha: adminHash,
      ativo: true,
      roleGlobal: 'admin',
      orgId: org.id,
    },
    create: {
      nome: 'Administrador',
      email: adminEmail,
      hashSenha: adminHash,
      ativo: true,
      roleGlobal: 'admin',
      orgId: org.id,
    },
  })
  console.log('✅ Usuário admin criado')

  // Criar agentes
  const agente1 = await prisma.usuario.upsert({
    where: { email: 'joao@birding.local' },
    update: { orgId: org.id },
    create: {
      nome: 'João Silva',
      email: 'joao@birding.local',
      hashSenha: await hashPassword('senha123'),
      ativo: true,
      roleGlobal: 'agente',
      orgId: org.id,
    },
  })

  const agente2 = await prisma.usuario.upsert({
    where: { email: 'maria@birding.local' },
    update: { orgId: org.id },
    create: {
      nome: 'Maria Santos',
      email: 'maria@birding.local',
      hashSenha: await hashPassword('senha123'),
      ativo: true,
      roleGlobal: 'agente',
      orgId: org.id,
    },
  })
  console.log('✅ Agentes criados')

  // Criar OS de exemplo
  const hoje = new Date()
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const proximaSemana = new Date(hoje)
  proximaSemana.setDate(proximaSemana.getDate() + 7)

  const duasSemanas = new Date(hoje)
  duasSemanas.setDate(duasSemanas.getDate() + 14)

  const os1 = await prisma.oS.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      titulo: 'Tour Pantanal Sul',
      destino: 'Corumbá, MS',
      dataInicio: proximaSemana,
      dataFim: duasSemanas,
      status: 'planejamento',
      agenteResponsavelId: agente1.id,
      orgId: org.id,
      descricao: 'Expedição fotográfica no Pantanal Sul com foco em aves aquáticas',
    },
  })

  const os2 = await prisma.oS.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      titulo: 'Bonito Express',
      destino: 'Bonito, MS',
      dataInicio: duasSemanas,
      dataFim: new Date(duasSemanas.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'reservas_confirmadas',
      agenteResponsavelId: agente2.id,
      orgId: org.id,
      descricao: 'Passeio de observação de aves em Bonito com mergulho no Rio da Prata',
    },
  })

  await prisma.oS.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      titulo: 'Chapada dos Guimarães',
      destino: 'Chapada dos Guimarães, MT',
      dataInicio: new Date(duasSemanas.getTime() + 7 * 24 * 60 * 60 * 1000),
      dataFim: new Date(duasSemanas.getTime() + 12 * 24 * 60 * 60 * 1000),
      status: 'cotacoes',
      agenteResponsavelId: agente1.id,
      orgId: org.id,
      descricao: 'Observação de araras-azuis e outras espécies endêmicas do cerrado',
    },
  })

  const os4 = await prisma.oS.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      titulo: 'Amazônia Premium',
      destino: 'Alta Floresta, MT',
      dataInicio: hoje,
      dataFim: new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: 'em_andamento',
      agenteResponsavelId: agente2.id,
      orgId: org.id,
      descricao: 'Expedição completa na Amazônia com lodge exclusivo',
    },
  })

  console.log('✅ OS de exemplo criadas')

  // Criar participantes para as OS
  await prisma.participante.createMany({
    data: [
      {
        osId: os1.id,
        nome: 'Carlos Rodrigues',
        email: 'carlos@email.com',
        telefone: '+55 11 98888-8888',
      },
      {
        osId: os1.id,
        nome: 'Ana Paula',
        email: 'ana@email.com',
        telefone: '+55 11 97777-7777',
      },
      {
        osId: os2.id,
        nome: 'Roberto Mendes',
        email: 'roberto@email.com',
        telefone: '+55 21 96666-6666',
      },
      {
        osId: os4.id,
        nome: 'Julia Costa',
        email: 'julia@email.com',
        telefone: '+55 41 95555-5555',
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Participantes criados')

  console.log('\n🎉 Seed concluído com sucesso!\n')
  console.log('📊 Dados criados:')
  console.log({
    organizacao: { nome: org.nome },
    usuarios: 3,
    os: 4,
    participantes: 4,
  })
  console.log('\n🔑 Credenciais de acesso:')
  console.log({
    admin: { email: adminEmail, senha: adminSenha },
    agente1: { email: 'joao@birding.local', senha: 'senha123' },
    agente2: { email: 'maria@birding.local', senha: 'senha123' },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
