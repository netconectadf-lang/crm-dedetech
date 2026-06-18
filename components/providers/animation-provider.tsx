"use client"

import { ReactNode, createContext, useContext, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { LoadingSpinner } from "@/components/animations/loading-spinner"
import { animationConfig } from "@/lib/animations.config"

interface AnimationContextType {
  showGlobalLoading: (message?: string) => void
  hideGlobalLoading: () => void
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [globalLoading, setGlobalLoading] = useState<string | null>(null)

  const showGlobalLoading = useCallback((message?: string) => {
    setGlobalLoading(message || "Carregando...")
  }, [])

  const hideGlobalLoading = useCallback(() => {
    setGlobalLoading(null)
  }, [])

  return (
    <AnimationContext.Provider value={{ showGlobalLoading, hideGlobalLoading }}>
      {children}

      {/* Global loading overlay (opcional) */}
      <AnimatePresence>
        {globalLoading && (
          <motion.div
            key="global-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: animationConfig.durations.fast,
              ease: animationConfig.easings.spring,
            }}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              className="flex flex-col items-center gap-3"
            >
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground">{globalLoading}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimationContext.Provider>
  )
}

/**
 * Hook para acessar o context de animações globais
 *
 * Uso:
 * const { showGlobalLoading, hideGlobalLoading } = useAnimation()
 *
 * const handleBigAction = async () => {
 *   showGlobalLoading("Processando...")
 *   try {
 *     await doSomethingImportant()
 *   } finally {
 *     hideGlobalLoading()
 *   }
 * }
 */
export function useAnimation() {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error("useAnimation deve ser usado dentro de AnimationProvider")
  }
  return context
}
