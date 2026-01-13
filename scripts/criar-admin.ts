import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function criarAdmin() {
  try {
    console.log('🔧 Criando usuário administrador...\n');

    // 1. Buscar ou criar organização
    let org = await prisma.organizacao.findFirst();
    
    if (!org) {
      org = await prisma.organizacao.create({
        data: { nome: 'Organização Principal' }
      });
      console.log('✓ Organização criada');
    } else {
      console.log(`✓ Usando organização: ${org.nome}`);
    }

    // 2. Verificar se admin já existe
    const adminEmail = 'admin@birdingtours.com';
    const adminExists = await prisma.usuario.findUnique({
      where: { email: adminEmail }
    });

    if (adminExists) {
      console.log('\n⚠️  Usuário admin já existe!');
      console.log(`   Email: ${adminExists.email}`);
      console.log(`   Nome: ${adminExists.nome}`);
      console.log(`   Status: ${adminExists.ativo ? 'Ativo' : 'Inativo'}`);
      
      // Perguntar se quer resetar a senha
      console.log('\n💡 Para resetar a senha, delete o usuário primeiro:');
      console.log(`   npx prisma studio`);
      console.log('   Ou execute: DELETE FROM "Usuario" WHERE email = \'${adminEmail}\';');
      
      await prisma.$disconnect();
      process.exit(0);
    }

    // 3. Criar usuário admin
    const senha = 'admin123';
    const hashSenha = await bcrypt.hash(senha, 10);
    
    const admin = await prisma.usuario.create({
      data: {
        orgId: org.id,
        nome: 'Administrador',
        email: adminEmail,
        hashSenha,
        roleGlobal: 'admin',
        ativo: true
      }
    });

    console.log('\n✅ Usuário administrador criado com sucesso!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@birdingtours.com');
    console.log('🔑 Senha:    admin123');
    console.log('👤 Nome:     Administrador');
    console.log('🎭 Função:   admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');

  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

criarAdmin();
