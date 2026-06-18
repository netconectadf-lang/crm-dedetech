import { useState, useCallback } from "react"

interface UseLoadingOptions {
  delay?: number
}

/**
 * Hook para gerenciar loading states em operações async
 *
 * Uso:
 * const { isLoading, startLoading, stopLoading } = useLoading()
 *
 * const handleFilter = async (filter: string) => {
 *   startLoading()
 *   try {
 *     await applyFilter(filter)
 *   } finally {
 *     stopLoading()
 *   }
 * }
 */
export function useLoading(options: UseLoadingOptions = {}) {
  const { delay = 0 } = options
  const [isLoading, setIsLoading] = useState(false)

  const startLoading = useCallback(() => {
    setIsLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    if (delay > 0) {
      setTimeout(() => setIsLoading(false), delay)
    } else {
      setIsLoading(false)
    }
  }, [delay])

  const runAsync = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      startLoading()
      try {
        return await fn()
      } finally {
        stopLoading()
      }
    },
    [startLoading, stopLoading]
  )

  return {
    isLoading,
    startLoading,
    stopLoading,
    runAsync,
  }
}

/**
 * Hook para múltiplos loading states com chaves
 *
 * Uso:
 * const { isLoading, startLoading, stopLoading } = useMultipleLoading()
 *
 * const handleFilter = async (filterId: string) => {
 *   startLoading(filterId)
 *   try {
 *     await applyFilter(filterId)
 *   } finally {
 *     stopLoading(filterId)
 *   }
 * }
 *
 * // Em um botão:
 * <button disabled={isLoading("filter-1")}>
 *   {isLoading("filter-1") ? "Carregando..." : "Aplicar"}
 * </button>
 */
export function useMultipleLoading(options: UseLoadingOptions = {}) {
  const { delay = 0 } = options
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())

  const isLoading = useCallback(
    (key: string) => loadingKeys.has(key),
    [loadingKeys]
  )

  const startLoading = useCallback((key: string) => {
    setLoadingKeys((prev) => new Set([...prev, key]))
  }, [])

  const stopLoading = useCallback((key: string) => {
    if (delay > 0) {
      setTimeout(() => {
        setLoadingKeys((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }, delay)
    } else {
      setLoadingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }, [delay])

  const runAsync = useCallback(
    async <T,>(key: string, fn: () => Promise<T>): Promise<T> => {
      startLoading(key)
      try {
        return await fn()
      } finally {
        stopLoading(key)
      }
    },
    [startLoading, stopLoading]
  )

  return {
    isLoading,
    startLoading,
    stopLoading,
    runAsync,
  }
}
