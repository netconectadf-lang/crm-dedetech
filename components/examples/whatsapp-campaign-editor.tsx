"use client"

/**
 * EXEMPLO REAL: Editor de campanha WhatsApp com feedback visual
 *
 * Demonstra:
 * - Carregamento de scripts
 * - Filtros por etiqueta com loading
 * - Mudança entre abas (script/filtros)
 * - Indicadores de progresso
 */

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { LoadingSpinner, SkeletonLine } from "@/components/animations"
import { useMultipleLoading } from "@/hooks/use-loading"
import { animationConfig } from "@/lib/animations.config"

type TabId = "script" | "filters" | "preview"

interface Script {
  id: string
  name: string
  content: string
}

interface Tag {
  id: string
  name: string
  count: number
  selected: boolean
}

export function WhatsappCampaignEditor() {
  const [activeTab, setActiveTab] = useState<TabId>("script")
  const [scripts, setScripts] = useState<Script[]>([])
  const [selectedScript, setSelectedScript] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])

  const { isLoading, runAsync } = useMultipleLoading({ delay: 200 })

  // Simula carregamento de scripts
  const handleTabChange = async (tabId: TabId) => {
    setActiveTab(tabId)

    if (tabId === "script" && scripts.length === 0) {
      await runAsync("scripts", async () => {
        // Em produção: await fetch("/api/whatsapp/scripts")
        const mockScripts = [
          { id: "1", name: "Boas-vindas", content: "Olá! Bem-vindo..." },
          { id: "2", name: "Promoção", content: "Confira nossa promoção..." },
          { id: "3", name: "Follow-up", content: "Gostaria de saber..." },
        ]
        setScripts(mockScripts)
      })
    }

    if (tabId === "filters" && tags.length === 0) {
      await runAsync("filters", async () => {
        // Em produção: await fetch("/api/tags")
        const mockTags = [
          { id: "1", name: "Cliente ativo", count: 142, selected: false },
          { id: "2", name: "Novo cliente", count: 38, selected: false },
          { id: "3", name: "Dormido", count: 214, selected: false },
          { id: "4", name: "VIP", count: 12, selected: false },
        ]
        setTags(mockTags)
      })
    }
  }

  const toggleTag = async (tagId: string) => {
    await runAsync(`tag-${tagId}`, async () => {
      setTags(tags.map(t =>
        t.id === tagId ? { ...t, selected: !t.selected } : t
      ))
    })
  }

  const tabs = [
    { id: "script" as const, label: "Script", icon: "📝" },
    { id: "filters" as const, label: "Filtros", icon: "🏷️" },
    { id: "preview" as const, label: "Prévia", icon: "👁️" },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Campanha WhatsApp</h1>
        <p className="text-muted-foreground">Escolha um script e aplique filtros</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            disabled={isLoading(tab.id)}
            className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 transition-colors relative ${
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}

            {/* Loading spinner */}
            {isLoading(tab.id) && (
              <LoadingSpinner size="sm" className="ml-1" />
            )}

            {/* Active indicator */}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
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
          {/* Script Selection Tab */}
          {activeTab === "script" && (
            <div className="space-y-3">
              {isLoading("scripts") ? (
                <SkeletonLine count={3} />
              ) : (
                <motion.div
                  className="grid gap-3"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: animationConfig.stagger.itemDelay,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {scripts.map((script, idx) => (
                    <motion.button
                      key={script.id}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        show: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: animationConfig.durations.normal,
                          },
                        },
                      }}
                      onClick={() => setSelectedScript(script.id)}
                      whileHover={{ x: 4 }}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        selectedScript === script.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <h3 className="font-medium">{script.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {script.content}
                      </p>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Filters Tab */}
          {activeTab === "filters" && (
            <div className="space-y-3">
              {isLoading("filters") ? (
                <SkeletonLine count={4} />
              ) : (
                <motion.div
                  className="grid gap-2"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: animationConfig.stagger.itemDelay,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {tags.map((tag) => (
                    <motion.label
                      key={tag.id}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        show: {
                          opacity: 1,
                          x: 0,
                          transition: {
                            duration: animationConfig.durations.normal,
                          },
                        },
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={tag.selected}
                        onChange={() => toggleTag(tag.id)}
                        disabled={isLoading(`tag-${tag.id}`)}
                        className="w-4 h-4 accent-primary"
                      />
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          {tag.name}
                          {isLoading(`tag-${tag.id}`) && (
                            <LoadingSpinner size="sm" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tag.count} contatos
                        </p>
                      </div>
                      <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-1 rounded">
                        {tag.count}
                      </span>
                    </motion.label>
                  ))}
                </motion.div>
              )}

              {/* Selected count */}
              {!isLoading("filters") && tags.some(t => t.selected) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-primary/10 border border-primary/30"
                >
                  <p className="text-sm font-medium text-primary">
                    {tags.filter(t => t.selected).reduce((sum, t) => sum + t.count, 0)} contatos selecionados
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === "preview" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-lg border border-border bg-card space-y-4"
            >
              <div>
                <p className="text-xs text-muted-foreground mb-2">Script selecionado</p>
                <p className="font-medium">
                  {selectedScript
                    ? scripts.find(s => s.id === selectedScript)?.name || "Nenhum"
                    : "Nenhum script selecionado"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Filtros aplicados</p>
                <div className="flex flex-wrap gap-2">
                  {tags.filter(t => t.selected).length > 0 ? (
                    tags
                      .filter(t => t.selected)
                      .map(tag => (
                        <motion.span
                          key={tag.id}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary"
                        >
                          {tag.name}
                        </motion.span>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum filtro</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Action Button */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
        >
          Enviar Campanha
        </motion.button>
      </div>
    </div>
  )
}
