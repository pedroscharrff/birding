import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            OS/Tour
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistema de Gestão de Operações de Turismo
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg">Entrar</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de OS</CardTitle>
              <CardDescription>
                Crie e gerencie Ordens de Serviço com facilidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Kanban visual por status</li>
                <li>Participantes e fornecedores</li>
                <li>Hospedagem e transporte</li>
                <li>Atividades programadas</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
              <CardDescription>
                Visualize todas as operações em um calendário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Visão mensal/semanal/diária</li>
                <li>Chegadas e saídas</li>
                <li>Recursos disponíveis</li>
                <li>Filtros personalizados</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
              <CardDescription>
                Controle completo de lançamentos financeiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Entradas e saídas</li>
                <li>Despesas de guias/motoristas</li>
                <li>Relatórios por OS</li>
                <li>Margem e custos</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Recursos Principais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div>
                  <h3 className="font-semibold mb-2">Operacional</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>✓ Gestão de participantes</li>
                    <li>✓ Fornecedores por categoria</li>
                    <li>✓ Passagens aéreas</li>
                    <li>✓ Scoutings e rotas</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Controle</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>✓ Permissões por papel</li>
                    <li>✓ Auditoria completa</li>
                    <li>✓ Histórico de mudanças</li>
                    <li>✓ Multi-organização</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
