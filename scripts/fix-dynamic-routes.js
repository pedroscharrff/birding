#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const routeFiles = [
  'app/api/auth/me/route.ts',
  'app/api/auth/logout/route.ts',
  'app/api/calendario/route.ts',
  'app/api/config/presets/most-used/route.ts',
  'app/api/config/presets/categories/route.ts',
  'app/api/config/presets/items/route.ts',
  'app/api/config/presets/templates/route.ts',
  'app/api/cotacoes/route.ts',
  'app/api/dashboard/stats/route.ts',
  'app/api/debug/alertas-guias/route.ts',
  'app/api/debug/usuarios/route.ts',
  'app/api/financeiro/fluxo-caixa/route.ts',
  'app/api/financeiro/resumo/route.ts',
  'app/api/financeiro/lancamentos/route.ts',
  'app/api/fornecedores/route.ts',
  'app/api/fornecedores/[id]/tarifas/route.ts',
  'app/api/jobs/alerts-refresh/route.ts',
  'app/api/notifications/route.ts',
  'app/api/os/route.ts',
  'app/api/os/[id]/auditoria/route.ts',
  'app/api/os/[id]/despesas/route.ts',
  'app/api/policies/route.ts',
  'app/api/storage/list/route.ts',
  'app/api/usuarios/route.ts',
  'app/api/usuarios/guias/route.ts',
];

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
    
    // Verificar se já tem export const dynamic
    if (content.includes('export const dynamic')) {
      console.log(`✓ Já configurado: ${file}`);
      skipped++;
      return;
    }

    // Encontrar a primeira linha de import
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      } else if (lastImportIndex !== -1 && lines[i].trim() !== '' && !lines[i].trim().startsWith('import')) {
        break;
      }
    }

    if (lastImportIndex === -1) {
      console.log(`⚠️  Nenhum import encontrado: ${file}`);
      skipped++;
      return;
    }

    // Adicionar export const dynamic após os imports
    lines.splice(lastImportIndex + 1, 0, '', 'export const dynamic = \'force-dynamic\'');
    
    const newContent = lines.join('\n');
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
