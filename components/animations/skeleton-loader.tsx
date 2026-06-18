"use client"

import { motion } from "motion/react"
import { animationConfig } from "@/lib/animations.config"
import { cn } from "@/lib/utils"

interface SkeletonLoaderProps {
  variant?: "card" | "table-row" | "table-cell" | "line" | "circle" | "avatar"
  count?: number
  className?: string
}

// Skeleton base com shimmer
function SkeletonBase({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{
        backgroundPosition: ["200% 0%", "-200% 0%"],
      }}
      transition={{
        duration: animationConfig.durations.skeleton,
        repeat: Infinity,
        ease: animationConfig.easings.linear,
      }}
      style={{
        backgroundImage: "linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 100%)",
        backgroundSize: "200% 100%",
      }}
      className={cn("rounded-md bg-muted", className)}
    />
  )
}

// Card skeleton (header + 3 linhas)
function CardSkeleton() {
  return (
    <div className="space-y-4 p-4 rounded-lg border border-border">
      <SkeletonBase className="h-4 w-1/3" />
      <div className="space-y-2">
        <SkeletonBase className="h-3 w-full" />
        <SkeletonBase className="h-3 w-5/6" />
      </div>
    </div>
  )
}

// Table row skeleton
function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="p-3"><SkeletonBase className="h-4 w-8" /></td>
      <td className="p-3"><SkeletonBase className="h-4 w-32" /></td>
      <td className="p-3"><SkeletonBase className="h-4 w-24" /></td>
      <td className="p-3"><SkeletonBase className="h-4 w-20" /></td>
      <td className="p-3"><SkeletonBase className="h-4 w-12" /></td>
    </tr>
  )
}

// Table cell skeleton
function TableCellSkeleton() {
  return <SkeletonBase className="h-4 w-full" />
}

// Line skeleton (para textos)
function LineSkeleton() {
  return <SkeletonBase className="h-4 w-full" />
}

// Circle skeleton (para avatares)
function CircleSkeleton() {
  return <SkeletonBase className="h-10 w-10 rounded-full" />
}

// Avatar skeleton (círculo + linhas)
function AvatarSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <SkeletonBase className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-32" />
        <SkeletonBase className="h-3 w-24" />
      </div>
    </div>
  )
}

export function SkeletonLoader({
  variant = "card",
  count = 1,
  className,
}: SkeletonLoaderProps) {
  const variants = {
    card: CardSkeleton,
    "table-row": TableRowSkeleton,
    "table-cell": TableCellSkeleton,
    line: LineSkeleton,
    circle: CircleSkeleton,
    avatar: AvatarSkeleton,
  }

  const Component = variants[variant]

  if (variant === "table-row") {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <Component key={i} />
        ))}
      </>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Component />
        </div>
      ))}
    </div>
  )
}

// Exports para uso direto
export function SkeletonCard(props: Omit<SkeletonLoaderProps, "variant">) {
  return <SkeletonLoader variant="card" {...props} />
}

export function SkeletonTableRow(props: Omit<SkeletonLoaderProps, "variant">) {
  return <SkeletonLoader variant="table-row" {...props} />
}

export function SkeletonLine(props: Omit<SkeletonLoaderProps, "variant">) {
  return <SkeletonLoader variant="line" {...props} />
}

export function SkeletonAvatar(props: Omit<SkeletonLoaderProps, "variant">) {
  return <SkeletonLoader variant="avatar" {...props} />
}
