# Calendário - Documentação

## Visão Geral

A página de Calendário foi criada para visualizar de forma organizada todos os tours/OS e seus eventos relacionados (atividades, hospedagens, transportes) em uma interface de calendário interativa.

## Localização

- **Rota**: `/dashboard/calendario`
- **Arquivo**: `app/(dashboard)/dashboard/calendario/page.tsx`
- **API**: `app/api/calendario/route.ts`

## Funcionalidades

### 1. Visualizações Múltiplas

O calendário oferece três modos de visualização:

- **Mês**: Visão mensal completa com todos os eventos
- **Semana**: Visão semanal detalhada com horários
- **Lista**: Listagem cronológica dos eventos

### 2. Tipos de Eventos

O calendário exibe diferentes tipos de eventos, cada um com cor específica:

#### Tours/OS (Azul - #3b82f6)
- Representa o período completo da operação (data início até data fim)
- Mostra título, número de participantes e destino
- Cor varia de acordo com o status da OS

#### Atividades (Verde - #10b981)
- Atividades programadas com data/hora específica
- Prefixo: 🎯
- Mostra nome da atividade e localização

#### Hospedagens (Roxo - #8b5cf6)
- Eventos de check-in e check-out
- Prefixo: 🏨
- Mostra nome do hotel

#### Transportes (Laranja - #f59e0b)
- Transportes com data/hora de partida
- Prefixo: 🚗
- Mostra origem → destino

### 3. Cores por Status da OS

- **Planejamento**: Cinza (#6b7280)
- **Cotações**: Azul (#3b82f6)
- **Reservas Pendentes**: Amarelo (#eab308)
- **Reservas Confirmadas**: Verde (#22c55e)
- **Documentação**: Ciano (#06b6d4)
- **Pronto para Viagem**: Roxo (#8b5cf6)
- **Em Andamento**: Rosa (#ec4899)
- **Concluída**: Verde escuro (#10b981)
- **Pós-viagem**: Teal (#14b8a6)
- **Cancelada**: Vermelho (#ef4444)

### 4. Interatividade

- **Clique em evento**: Redireciona para a página de detalhes da OS
- **Navegação**: Botões para anterior, próximo e hoje
- **Indicador de hoje**: Linha vermelha mostrando o horário atual
- **Links de navegação**: Clique nas datas para navegar

### 5. Recursos Adicionais

- **Localização**: Interface em português (pt-BR)
- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Limite de eventos**: Mostra até 3 eventos por dia, com link "mais" para expandir
- **Tooltip**: Informações detalhadas ao passar o mouse sobre eventos

## API Endpoint

### GET /api/calendario

Retorna todos os eventos do calendário para a organização do usuário autenticado.

#### Query Parameters (opcionais)

- `start`: Data de início do período (ISO 8601)
- `end`: Data de fim do período (ISO 8601)

#### Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": "os-uuid",
      "title": "Tour Pantanal",
      "start": "2025-11-01",
      "end": "2025-11-05",
      "allDay": true,
      "backgroundColor": "#22c55e",
      "borderColor": "#22c55e",
      "extendedProps": {
        "type": "os",
        "osId": "uuid",
        "status": "reservas_confirmadas",
        "destino": "Pantanal",
        "participantes": 8,
        "agente": "João Silva"
      }
    }
  ]
}
```

## Estilos

Os estilos customizados do FullCalendar estão em `app/globals.css` na seção "FullCalendar Styles".

### Variáveis CSS Customizadas

```css
--fc-border-color: #e5e7eb
--fc-button-bg-color: #3b82f6
--fc-today-bg-color: #dbeafe
```

## Dependências

- **@fullcalendar/react**: Componente React do FullCalendar
- **@fullcalendar/daygrid**: Plugin de visualização mensal
- **@fullcalendar/timegrid**: Plugin de visualização semanal/diária
- **@fullcalendar/list**: Plugin de visualização em lista
- **@fullcalendar/interaction**: Plugin de interação (cliques, seleção)

## Melhorias Futuras

1. **Filtros**: Adicionar filtros por tipo de evento, status, agente
2. **Criação de eventos**: Permitir criar/editar eventos diretamente no calendário
3. **Drag & Drop**: Arrastar eventos para alterar datas
4. **Sincronização**: Integração com Google Calendar, Outlook
5. **Exportação**: Exportar calendário em formato iCal
6. **Notificações**: Alertas para eventos próximos
7. **Visualização de recursos**: Mostrar disponibilidade de guias, motoristas, veículos
