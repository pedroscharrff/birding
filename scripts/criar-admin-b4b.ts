import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function criarAdminB4B() {
  try {
    console.log('Criando usuário super admin B4B...\n');

    const { PWD } = process.env;

    let org = await prisma.organizacao.findFirst();

    if (!org) {
      org = await prisma.organizacao.create({
        data: { nome: 'Birding Tours' }
      });
      console.log('Organizacao criada');
    } else {
      console.log(`Usando organizacao: ${org.nome}`);
    }

    const adminEmail = 'admin@b4b.agency';
    const adminSenha = 'S3lab2024$';

    const adminExists = await prisma.usuario.findUnique({
      where: { email: adminEmail }
    });

    if (adminExists) {
      console.log(`Usuario admin ${adminEmail} ja existe. Atualizando senha...`);
      const hashSenha = await bcrypt.hash(adminSenha, 10);
      await prisma.usuario.update({
        where: { email: adminEmail },
        data: {
          hashSenha,
          nome: 'Super Admin B4B',
          roleGlobal: 'admin',
          ativo: true,
        }
      });
      console.log('Senha atualizada com sucesso!\n');
    } else {
      const hashSenha = await bcrypt.hash(adminSenha, 10);
      await prisma.usuario.create({
        data: {
          orgId: org.id,
          nome: 'Super Admin B4B',
          email: adminEmail,
          hashSenha,
          roleGlobal: 'admin',
          ativo: true,
        }
      });
      console.log('Usuario admin criado com sucesso!\n');
    }

    console.log('Email:    admin@b4b.agency');
    console.log('Senha:    S3lab2024$');
    console.log('Nome:     Super Admin B4B');
    console.log('Funcao:   admin\n');
    console.log('Este usuario pode alterar senhas de todos os usuarios na pagina Super Admin.\n');

  } catch (error) {
    console.error('Erro ao criar administrador:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

criarAdminB4B();
