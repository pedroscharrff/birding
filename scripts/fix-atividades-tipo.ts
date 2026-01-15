import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAtividadesTipo() {
  console.log('🔧 Iniciando correção de tipos de atividades...')

  try {
    // 1. Contar registros sem tipo
    const semTipo = await prisma.atividade.count({
      where: {
        tipo: null,
      },
    })

    console.log(`📊 Encontrados ${semTipo} registros sem tipo definido`)

    if (semTipo === 0) {
      console.log('✅ Todos os registros já possuem tipo definido!')
      return
    }

    // 2. Atualizar registros que são alimentação (baseado no nome)
    const alimentacaoUpdated = await prisma.atividade.updateMany({
      where: {
        tipo: null,
        OR: [
          { nome: { contains: 'Alimentação:', mode: 'insensitive' } },
          { nome: { contains: 'Refeição:', mode: 'insensitive' } },
          { nome: { contains: 'almoço', mode: 'insensitive' } },
          { nome: { contains: 'jantar', mode: 'insensitive' } },
          { nome: { contains: 'café da manhã', mode: 'insensitive' } },
          { nome: { contains: 'lanche', mode: 'insensitive' } },
        ],
      },
      data: {
        tipo: 'alimentacao',
      },
    })

    console.log(`🍽️  Atualizados ${alimentacaoUpdated.count} registros para tipo 'alimentacao'`)

    // 3. Atualizar os demais para 'atividade'
    const atividadeUpdated = await prisma.atividade.updateMany({
      where: {
        tipo: null,
      },
      data: {
        tipo: 'atividade',
      },
    })

    console.log(`🎯 Atualizados ${atividadeUpdated.count} registros para tipo 'atividade'`)

    // 4. Verificar resultado final
    const resultado = await prisma.atividade.groupBy({
      by: ['tipo'],
      _count: {
        tipo: true,
      },
    })

    console.log('\n📈 Resultado final:')
    resultado.forEach((r) => {
      console.log(`   ${r.tipo}: ${r._count.tipo} registros`)
    })

    console.log('\n✅ Correção concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao corrigir tipos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixAtividadesTipo()
  .then(() => {
    console.log('\n🎉 Script finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })
