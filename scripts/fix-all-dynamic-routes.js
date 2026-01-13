#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Procurando todas as rotas da API...\n');

// Encontrar todos os arquivos route.ts na pasta app/api
const findRouteFiles = () => {
  try {
    const output = execSync('find app/api -name "route.ts" -type f', { 
      cwd: process.cwd(),
      encoding: 'utf8' 
    });
    return output.trim().split('\n').filter(f => f);
  } catch (error) {
    // Fallback para Windows
    const routes = [];
    const walkSync = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkSync(filePath);
        } else if (file === 'route.ts') {
          routes.push(filePath.replace(/\\/g, '/'));
        }
      });
    };
    walkSync('app/api');
    return routes;
  }
};

const routeFiles = findRouteFiles();
console.log(`📁 Encontrados ${routeFiles.length} arquivos de rota\n`);

let fixed = 0;
let skipped = 0;
let errors = 0;

routeFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
    skipped++;
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar se já tem export const dynamic corretamente posicionado
    const lines = content.split('\n');
    let hasCorrectDynamic = false;
    let lastImportLine = -1;
    let inMultiLineImport = false;
    
    // Encontrar a última linha de import
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      
      if (trimmed.startsWith('import ')) {
        lastImportLine = i;
        if (trimmed.includes('{') && !trimmed.includes('}')) {
          inMultiLineImport = true;
        }
      } else if (inMultiLineImport) {
        lastImportLine = i;
        if (trimmed.includes('}')) {
          inMultiLineImport = false;
        }
      } else if (trimmed === "export const dynamic = 'force-dynamic'" && lastImportLine !== -1) {
        // Verificar se está logo após os imports
        let foundNonEmpty = false;
        for (let j = lastImportLine + 1; j < i; j++) {
          if (lines[j].trim() !== '') {
            foundNonEmpty = true;
            break;
          }
        }
        if (!foundNonEmpty) {
          hasCorrectDynamic = true;
        }
      }
    }

    if (hasCorrectDynamic) {
      console.log(`✓ Já configurado: ${file}`);
      skipped++;
      return;
    }

    // Remover qualquer export const dynamic existente no lugar errado
    const cleanedLines = lines.filter(line => 
      line.trim() !== "export const dynamic = 'force-dynamic'"
    );

    // Encontrar novamente a última linha de import nas linhas limpas
    lastImportLine = -1;
    inMultiLineImport = false;
    
    for (let i = 0; i < cleanedLines.length; i++) {
      const trimmed = cleanedLines[i].trim();
      
      if (trimmed.startsWith('import ')) {
        lastImportLine = i;
        if (trimmed.includes('{') && !trimmed.includes('}')) {
          inMultiLineImport = true;
        }
      } else if (inMultiLineImport) {
        lastImportLine = i;
        if (trimmed.includes('}')) {
          inMultiLineImport = false;
        }
      } else if (lastImportLine !== -1 && trimmed !== '' && !trimmed.startsWith('//')) {
        break;
      }
    }

    if (lastImportLine === -1) {
      console.log(`⚠️  Nenhum import encontrado: ${file}`);
      skipped++;
      return;
    }

    // Adicionar export const dynamic após todos os imports
    cleanedLines.splice(lastImportLine + 1, 0, '', "export const dynamic = 'force-dynamic'");
    
    const newContent = cleanedLines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    console.log(`✅ Corrigido: ${file}`);
    fixed++;
  } catch (error) {
    console.error(`❌ Erro ao processar ${file}:`, error.message);
    errors++;
  }
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Corrigidos: ${fixed}`);
console.log(`⚠️  Ignorados: ${skipped}`);
console.log(`❌ Erros: ${errors}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (fixed > 0) {
  console.log('✨ Rotas corrigidas com sucesso! Execute npm run build para testar.\n');
}
