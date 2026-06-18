"use client"

/**
 * EXEMPLO 2: Tabela com skeleton loading durante fetch
 */

import { useState, useEffect } from "react"
import { SkeletonTableRow } from "@/components/animations"
import { useLoading } from "@/hooks/use-loading"

interface DataRow {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export function TableWithLoading() {
  const [data, setData] = useState<DataRow[]>([])
  const { isLoading, runAsync } = useLoading()

  useEffect(() => {
    // Simula carregamento inicial
    runAsync(async () => {
      const response = await fetch("/api/data")
      const json = await response.json()
      setData(json)
    })
  }, [runAsync])

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="p-3 text-left font-medium">ID</th>
            <th className="p-3 text-left font-medium">Nome</th>
            <th className="p-3 text-left font-medium">Email</th>
            <th className="p-3 text-left font-medium">Role</th>
            <th className="p-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <SkeletonTableRow count={5} />
          ) : (
            data.map((row) => (
              <tr key={row.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="p-3">{row.id}</td>
                <td className="p-3">{row.name}</td>
                <td className="p-3">{row.email}</td>
                <td className="p-3">{row.role}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
                    {row.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
