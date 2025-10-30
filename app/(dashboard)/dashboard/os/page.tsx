import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function OSPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-gray-600 mt-2">
            Gerencie todas as operações de turismo
          </p>
        </div>
        <Button>+ Nova OS</Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Encontre operações específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Input placeholder="Buscar por título..." />
            <Input placeholder="Destino..." />
            <Input type="date" placeholder="Data início" />
            <Input type="date" placeholder="Data fim" />
          </div>
        </CardContent>
      </Card>

      {/* Lista de OS */}
      <div className="space-y-4">
        <Card className="hover:shadow-md transition cursor-pointer">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">Tour Pantanal Sul</CardTitle>
                <CardDescription>Corumbá, MS - 15 a 20 Janeiro 2025</CardDescription>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                Planejamento
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div>
                <span className="font-semibold">8</span> Participantes
              </div>
              <div>
                <span className="font-semibold">3</span> Atividades
              </div>
              <div>
                <span className="font-semibold">2</span> Hospedagens
              </div>
              <div className="ml-auto">
                Responsável: <span className="font-semibold">João Silva</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition cursor-pointer">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">Bonito Express</CardTitle>
                <CardDescription>Bonito, MS - 22 a 25 Janeiro 2025</CardDescription>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                Confirmada
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div>
                <span className="font-semibold">12</span> Participantes
              </div>
              <div>
                <span className="font-semibold">5</span> Atividades
              </div>
              <div>
                <span className="font-semibold">1</span> Hospedagem
              </div>
              <div className="ml-auto">
                Responsável: <span className="font-semibold">Maria Santos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition cursor-pointer">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">Chapada dos Guimarães</CardTitle>
                <CardDescription>Chapada dos Guimarães, MT - 28 Jan a 02 Fev 2025</CardDescription>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                Cotações
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div>
                <span className="font-semibold">6</span> Participantes
              </div>
              <div>
                <span className="font-semibold">4</span> Atividades
              </div>
              <div>
                <span className="font-semibold">2</span> Hospedagens
              </div>
              <div className="ml-auto">
                Responsável: <span className="font-semibold">Pedro Costa</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition cursor-pointer border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">Beto Carrero World</CardTitle>
                <CardDescription>Penha, SC - 14 a 18 Janeiro 2025</CardDescription>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                Em Andamento
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div>
                <span className="font-semibold">15</span> Participantes
              </div>
              <div>
                <span className="font-semibold">2</span> Atividades
              </div>
              <div>
                <span className="font-semibold">1</span> Hospedagem
              </div>
              <div className="ml-auto">
                Responsável: <span className="font-semibold">Ana Paula</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
