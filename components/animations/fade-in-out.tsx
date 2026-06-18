"use client"

import { motion, AnimatePresence } from "motion/react"
import { animationConfig } from "@/lib/animations.config"

interface FadeInOutProps<T> {
  isVisible: boolean
  children: React.ReactNode
  mode?: "wait" | "sync" | "popLayout"
}

// Para transições simples de visibilidade
export function FadeInOut({
  isVisible,
  children,
  mode = "wait",
}: FadeInOutProps<unknown>) {
  return (
    <AnimatePresence mode={mode}>
      {isVisible && (
        <motion.div
          key="fade-in-out"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: animationConfig.durations.normal,
            ease: animationConfig.easings.spring,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Para transições com mudança de conteúdo
interface CrossFadeProps {
  children: React.ReactNode
  key: string | number
}

export function CrossFade({ children, key }: CrossFadeProps) {
  return (
    <motion.div
      key={key}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: animationConfig.durations.normal,
        ease: animationConfig.easings.spring,
      }}
    >
      {children}
    </motion.div>
  )
}
