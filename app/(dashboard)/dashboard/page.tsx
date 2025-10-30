import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Visão geral das operações de turismo
        </p>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de OS</CardDescription>
            <CardTitle className="text-3xl">42</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              +12% desde o último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Em Andamento</CardDescription>
            <CardTitle className="text-3xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Operações ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Próxima Semana</CardDescription>
            <CardTitle className="text-3xl">5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Chegadas programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendências</CardDescription>
            <CardTitle className="text-3xl">3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Quadro Kanban</CardTitle>
          <CardDescription>
            Visão rápida das operações por status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-3 text-gray-700">
                Planejamento
              </h3>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
                  <p className="text-sm font-medium">Tour Pantanal</p>
                  <p className="text-xs text-gray-500 mt-1">15-20 Jan</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
                  <p className="text-sm font-medium">Bonito Express</p>
                  <p className="text-xs text-gray-500 mt-1">22-25 Jan</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-3 text-blue-700">
                Cotações
              </h3>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded shadow-sm border border-blue-200">
                  <p className="text-sm font-medium">Chapada dos Guimarães</p>
                  <p className="text-xs text-gray-500 mt-1">28 Jan - 02 Fev</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-3 text-yellow-700">
                Reservas Pendentes
              </h3>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded shadow-sm border border-yellow-200">
                  <p className="text-sm font-medium">Nobres 3 Dias</p>
                  <p className="text-xs text-gray-500 mt-1">05-08 Fev</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-3 text-green-700">
                Confirmadas
              </h3>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded shadow-sm border border-green-200">
                  <p className="text-sm font-medium">Jalapão Adventure</p>
                  <p className="text-xs text-gray-500 mt-1">10-17 Fev</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-green-200">
                  <p className="text-sm font-medium">Amazônia Premium</p>
                  <p className="text-xs text-gray-500 mt-1">20-27 Fev</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-3 text-purple-700">
                Em Andamento
              </h3>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded shadow-sm border border-purple-200">
                  <p className="text-sm font-medium">Beto Carrero</p>
                  <p className="text-xs text-gray-500 mt-1">Hoje - 18 Jan</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">OS criada: Tour Pantanal</p>
                  <p className="text-xs text-gray-500">por João Silva - há 2 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Reserva confirmada: Hotel Zagaia</p>
                  <p className="text-xs text-gray-500">por Maria Santos - há 4 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Lançamento financeiro adicionado</p>
                  <p className="text-xs text-gray-500">por Pedro Costa - há 6 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Chegadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">Bonito Express</p>
                  <p className="text-xs text-gray-500">8 participantes</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">15 Jan</p>
                  <p className="text-xs text-gray-500">14:30</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">Chapada dos Guimarães</p>
                  <p className="text-xs text-gray-500">12 participantes</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">18 Jan</p>
                  <p className="text-xs text-gray-500">10:00</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">Nobres 3 Dias</p>
                  <p className="text-xs text-gray-500">6 participantes</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">20 Jan</p>
                  <p className="text-xs text-gray-500">16:00</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
