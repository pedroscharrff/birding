import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarUsuarios() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...\n');

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        roleGlobal: true,
        ativo: true,
        orgId: true,
      },
    });

    console.log(`📊 Total de usuários encontrados: ${usuarios.length}\n`);

    if (usuarios.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado no banco de dados!');
      console.log('💡 Execute o script de seed ou crie usuários manualmente.\n');
    } else {
      console.log('✅ Usuários encontrados:\n');
      usuarios.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Função: ${user.roleGlobal}`);
        console.log(`   Status: ${user.ativo ? 'Ativo' : 'Inativo'}`);
        console.log(`   Org ID: ${user.orgId}`);
        console.log('');
      });
    }

    // Verificar organizações
    const orgs = await prisma.organizacao.findMany({
      select: {
        id: true,
        nome: true,
        _count: {
          select: {
            usuarios: true,
          },
        },
      },
    });

    console.log(`\n🏢 Organizações encontradas: ${orgs.length}\n`);
    orgs.forEach((org, index) => {
      console.log(`${index + 1}. ${org.nome}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Usuários: ${org._count.usuarios}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarUsuarios();
