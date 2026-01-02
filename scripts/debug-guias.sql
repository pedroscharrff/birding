-- Script SQL para debug de guias e alertas
-- Execute isso no Prisma Studio ou diretamente no PostgreSQL

-- 1. Ver todas as OS ativas com suas designações de guias
SELECT
  o.id AS os_id,
  o.titulo,
  o.data_inicio,
  o.status,
  EXTRACT(DAY FROM (o.data_inicio - CURRENT_DATE)) AS dias_ate_inicio,
  COUNT(DISTINCT gd.id) AS guias_internos,
  COUNT(DISTINCT CASE WHEN osf.categoria = 'guiamento' THEN osf.id END) AS guias_externos,
  COUNT(DISTINCT gd.id) + COUNT(DISTINCT CASE WHEN osf.categoria = 'guiamento' THEN osf.id END) AS total_guias,
  CASE
    WHEN (EXTRACT(DAY FROM (o.data_inicio - CURRENT_DATE)) <= 15
      AND EXTRACT(DAY FROM (o.data_inicio - CURRENT_DATE)) > 0
      AND (COUNT(DISTINCT gd.id) + COUNT(DISTINCT CASE WHEN osf.categoria = 'guiamento' THEN osf.id END)) = 0)
    THEN 'DEVE GERAR ALERTA ❌'
    ELSE 'Sem alerta ✅'
  END AS status_alerta
FROM os o
LEFT JOIN os_guias_designacao gd ON gd.os_id = o.id
LEFT JOIN os_fornecedores osf ON osf.os_id = o.id
WHERE o.status NOT IN ('concluida', 'pos_viagem', 'cancelada')
GROUP BY o.id, o.titulo, o.data_inicio, o.status
ORDER BY o.data_inicio;

-- 2. Detalhes dos guias internos
SELECT
  o.titulo AS os,
  u.nome AS guia,
  u.email,
  gd.funcao,
  'INTERNO' AS tipo
FROM os_guias_designacao gd
JOIN os o ON o.id = gd.os_id
JOIN usuarios u ON u.id = gd.guia_id
WHERE o.status NOT IN ('concluida', 'pos_viagem', 'cancelada')
ORDER BY o.titulo;

-- 3. Detalhes dos fornecedores tipo guiamento
SELECT
  o.titulo AS os,
  f.nome_fantasia AS fornecedor,
  osf.categoria,
  'EXTERNO' AS tipo
FROM os_fornecedores osf
JOIN os o ON o.id = osf.os_id
JOIN fornecedores f ON f.id = osf.fornecedor_id
WHERE osf.categoria = 'guiamento'
  AND o.status NOT IN ('concluida', 'pos_viagem', 'cancelada')
ORDER BY o.titulo;

-- 4. OS que DEVERIAM ter alerta mas têm guias (para debug)
SELECT
  o.id,
  o.titulo,
  EXTRACT(DAY FROM (o.data_inicio - CURRENT_DATE)) AS dias_ate_inicio,
  COUNT(DISTINCT gd.id) AS guias_internos,
  COUNT(DISTINCT CASE WHEN osf.categoria = 'guiamento' THEN osf.id END) AS guias_externos,
  array_agg(DISTINCT u.nome) FILTER (WHERE u.nome IS NOT NULL) AS nomes_guias_internos,
  array_agg(DISTINCT f.nome_fantasia) FILTER (WHERE f.nome_fantasia IS NOT NULL AND osf.categoria = 'guiamento') AS nomes_guias_externos
FROM os o
LEFT JOIN os_guias_designacao gd ON gd.os_id = o.id
LEFT JOIN usuarios u ON u.id = gd.guia_id
LEFT JOIN os_fornecedores osf ON osf.os_id = o.id
LEFT JOIN fornecedores f ON f.id = osf.fornecedor_id
WHERE o.status NOT IN ('concluida', 'pos_viagem', 'cancelada')
  AND EXTRACT(DAY FROM (o.data_inicio - CURRENT_DATE)) <= 15
  AND EXTRACT(DAY FROM (o.data_inicio - CURRENT_DATE)) > 0
GROUP BY o.id, o.titulo, o.data_inicio
HAVING (COUNT(DISTINCT gd.id) + COUNT(DISTINCT CASE WHEN osf.categoria = 'guiamento' THEN osf.id END)) > 0
ORDER BY o.data_inicio;
