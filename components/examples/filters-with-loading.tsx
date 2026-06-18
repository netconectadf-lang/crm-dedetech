"use client"

/**
 * EXEMPLO 3: Filtros/Tabs com loading state e cross-fade
 */

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { LoadingSpinner } from "@/components/animations"
import { useMultipleLoading } from "@/hooks/use-loading"
import { animationConfig } from "@/lib/animations.config"

type FilterTab = "all" | "active" | "inactive" | "archived"

interface FilterData {
  id: string
  title: string
  count: number
}

const filterTabs: Array<{ id: FilterTab; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Ativos" },
  { id: "inactive", label: "Inativos" },
  { id: "archived", label: "Arquivados" },
]

export function FiltersWithLoading() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [data, setData] = useState<FilterData[] | null>(null)
  const { isLoading, runAsync } = useMultipleLoading({ delay: 200 })

  const handleTabChange = async (tabId: FilterTab) => {
    setActiveTab(tabId)
    await runAsync(tabId, async () => {
      // Simula fetch de dados do filtro
      const response = await fetch(`/api/filter?type=${tabId}`)
      const json = await response.json()
      setData(json)
    })
  }

  return (
    <div className="space-y-6">
      {/* Tabs com feedback visual */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-3 font-medium whitespace-nowrap transition-colors relative ${
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            disabled={isLoading(tab.id)}
          >
            {tab.label}

            {/* Indicador de ativo com underline animado */}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              />
            )}

            {/* Spinner quando carregando */}
            {isLoading(tab.id) && (
              <div className="ml-2 inline">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo com cross-fade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: animationConfig.durations.normal,
            ease: animationConfig.easings.spring,
          }}
          className="space-y-4"
        >
          {isLoading(activeTab) ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : data ? (
            <div className="grid gap-4">
              {data.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: animationConfig.durations.normal,
                    ease: animationConfig.easings.spring,
                    delay: i * animationConfig.stagger.itemDelay,
                  }}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{item.title}</h3>
                    <span className="px-2 py-1 rounded bg-primary/20 text-xs text-primary">
                      {item.count}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
