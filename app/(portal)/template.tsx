"use client"

import { motion } from "motion/react"
import { animationConfig } from "@/lib/animations.config"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: animationConfig.durations.normal,
        ease: animationConfig.easings.spring,
      }}
    >
      {children}
    </motion.div>
  )
}
