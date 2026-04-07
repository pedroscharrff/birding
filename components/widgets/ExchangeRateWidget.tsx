"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExchangeRate {
  moeda: string
  nome: string
  compra: number
  venda: number
  fechoAnterior: number
  dataAtualizacao: string
}

export function ExchangeRateWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [rates, setRates] = useState<{ usd: ExchangeRate | null, eur: ExchangeRate | null }>({ usd: null, eur: null })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchRates = async () => {
    setIsLoading(true)
    setError(false)
    try {
      const [usdRes, eurRes] = await Promise.all([
        fetch('https://br.dolarapi.com/v1/cotacoes/usd'),
        fetch('https://br.dolarapi.com/v1/cotacoes/eur')
      ])

      if (!usdRes.ok || !eurRes.ok) throw new Error('Falha ao buscar cotações')

      const usd = await usdRes.json()
      const eur = await eurRes.json()

      setRates({ usd, eur })
    } catch (err) {
      console.error("Erro ao buscar cotações:", err)
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
    const interval = setInterval(fetchRates, 1000 * 60 * 60) // Atualiza a cada 1 hora
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const renderRateCard = (rate: ExchangeRate | null, flag: string) => {
    if (!rate) return null

    const isUp = rate.venda >= rate.fechoAnterior
    const variation = ((rate.venda - rate.fechoAnterior) / rate.fechoAnterior) * 100

    return (
      <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100/50 transition-all hover:bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{flag}</span>
            <span className="font-semibold text-gray-800">{rate.moeda}</span>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
            isUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(variation).toFixed(2)}%
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Compra</p>
            <p className="font-semibold text-gray-900">{formatCurrency(rate.compra)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Venda</p>
            <p className="font-semibold text-gray-900">{formatCurrency(rate.venda)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end justify-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-16 right-0 mb-2 w-72 bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          >
            <div className="p-4 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">Cotações</h3>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={fetchRates}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                  aria-label="Atualizar"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {error ? (
                <div className="text-sm text-rose-500 text-center py-4">
                  Não foi possível carregar as cotações no momento.
                </div>
              ) : isLoading && !rates.usd && !rates.eur ? (
                <div className="flex flex-col gap-3 py-2">
                  <div className="h-24 bg-gray-100 animate-pulse rounded-xl" />
                  <div className="h-24 bg-gray-100 animate-pulse rounded-xl" />
                </div>
              ) : (
                <>
                  {renderRateCard(rates.usd, "🇺🇸")}
                  {renderRateCard(rates.eur, "🇪🇺")}
                  
                  { rates.usd && (
                    <p className="text-[10px] text-center text-gray-400 pt-2 flex items-center justify-center gap-1">
                      Última atualização às {formatDate(rates.usd.dataAtualizacao)}
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg transition-colors backdrop-blur-sm",
          isOpen 
            ? "bg-gray-900 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]" 
            : "bg-white/80 text-gray-600 hover:text-blue-600 hover:bg-white shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-200/50"
        )}
      >
        <DollarSign className="w-5 h-5" />
      </motion.button>
    </div>
  )
}
