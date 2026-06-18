"use client"

/**
 * EXEMPLO 4: Grid de cards com skeleton e stagger animation
 */

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { SkeletonCard } from "@/components/animations"
import { useLoading } from "@/hooks/use-loading"
import { animationConfig } from "@/lib/animations.config"

interface Card {
  id: string
  title: string
  description: string
  value: number
  trend: number
}

export function CardGridLoading() {
  const [cards, setCards] = useState<Card[]>([])
  const { isLoading, runAsync } = useLoading()

  useEffect(() => {
    runAsync(async () => {
      const response = await fetch("/api/dashboard-cards")
      const json = await response.json()
      setCards(json)
    })
  }, [runAsync])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: animationConfig.stagger.itemDelay,
        delayChildren: animationConfig.stagger.containerDelay,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: animationConfig.durations.normal,
        ease: animationConfig.easings.spring,
      },
    },
  }

  return (
    <div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {cards.map((card) => (
            <motion.div
              key={card.id}
              variants={item}
              whileHover={{
                y: -4,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
              className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow"
            >
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </h3>

                <div className="space-y-1">
                  <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                  <p
                    className={`text-xs font-medium ${
                      card.trend >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {card.trend >= 0 ? "+" : ""}{card.trend}% vs mês anterior
                  </p>
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  {card.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
