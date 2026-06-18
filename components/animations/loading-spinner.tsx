"use client"

import { motion } from "motion/react"
import { animationConfig } from "@/lib/animations.config"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: animationConfig.durations.fast,
        repeat: Infinity,
        ease: animationConfig.easings.linear,
      }}
      className={cn(
        "border-2 border-current border-t-transparent rounded-full",
        sizeMap[size],
        className
      )}
    />
  )
}
