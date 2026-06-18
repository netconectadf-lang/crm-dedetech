"use client"

import { motion } from "motion/react"
import { animationConfig, slideUpVariants } from "@/lib/animations.config"

interface PageTransitionProps {
  children: React.ReactNode
  variant?: "fade" | "slide-up" | "scale"
}

export function PageTransition({
  children,
  variant = "slide-up",
}: PageTransitionProps) {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    "slide-up": {
      initial: slideUpVariants.hidden,
      animate: slideUpVariants.visible,
      exit: slideUpVariants.exit,
    },
    scale: {
      initial: { opacity: 0, scale: 0.96 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
  }

  const variantConfig = variants[variant]

  return (
    <motion.div
      initial={variantConfig.initial}
      animate={variantConfig.animate}
      exit={variantConfig.exit}
      transition={{
        duration: animationConfig.durations.normal,
        ease: animationConfig.easings.spring,
      }}
    >
      {children}
    </motion.div>
  )
}
