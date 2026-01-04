import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar a organização principal
    const org = await prisma.organizacao.findFirst({
      where: {
        nome: {
          not: '1'
        }
      }
    });

    if (!org) {
      console.log('Nenhuma organização encontrada');
      return;
    }

    console.log(`Criando usuários na organização: ${org.nome}`);

    // Criar usuários de teste
    const usuarios = [
      {
        nome: 'João Silva',
        email: 'joao@birdingtours.com',
        roleGlobal: 'agente',
        senha: 'senha123'
      },
      {
        nome: 'Maria Santos',
        email: 'maria@birdingtours.com',
        roleGlobal: 'agente',
        senha: 'senha123'
      },
      {
        nome: 'Carlos Guia',
        email: 'carlos@birdingtours.com',
        roleGlobal: 'guia',
        senha: 'senha123'
      }
    ];

    for (const user of usuarios) {
      const hashSenha = await bcrypt.hash(user.senha, 10);
      
      const existe = await prisma.usuario.findUnique({
        where: { email: user.email }
      });

      if (existe) {
        console.log(`✓ ${user.email} já existe`);
        continue;
      }

      await prisma.usuario.create({
        data: {
          orgId: org.id,
          nome: user.nome,
          email: user.email,
          roleGlobal: user.roleGlobal as any,
          hashSenha,
          ativo: true,
        }
      });

      console.log(`✓ Criado: ${user.nome} (${user.email})`);
    }

    console.log('\nConcluído!');
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
