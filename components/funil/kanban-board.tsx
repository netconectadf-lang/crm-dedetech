"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ExternalLink, GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { STAGES, ORIGIN_LABEL, type DealStage, type LeadOrigin } from "@/lib/funil";
import { moverDeal } from "@/app/(app)/funil/actions";
import { Badge } from "@/components/ui/badge";

export type DealCard = {
  id: string;
  nome_contato: string;
  valor_estimado: number;
  origem: LeadOrigin;
  stage: DealStage;
};

export function KanbanBoard({ initialDeals }: { initialDeals: DealCard[] }) {
  const [deals, setDeals] = useState(initialDeals);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    const dealId = String(active.id);
    const newStage = String(over.id) as DealStage;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)),
    );
    void moverDeal(dealId, newStage);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <Column
            key={stage.key}
            stage={stage.key}
            label={stage.label}
            tone={stage.tone}
            deals={deals.filter((d) => d.stage === stage.key)}
          />
        ))}
      </div>
    </DndContext>
  );
}

function Column({
  stage,
  label,
  tone,
  deals,
}: {
  stage: DealStage;
  label: string;
  tone: string;
  deals: DealCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((s, d) => s + Number(d.valor_estimado), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 transition-colors",
        isOver && "ring-2 ring-teal-500",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", tone)}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {deals.length} · {formatBRL(total)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        {deals.map((deal) => (
          <Card key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Vazio
          </p>
        )}
      </div>
    </div>
  );
}

function Card({ deal }: { deal: DealCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id });

  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
          : undefined
      }
      className={cn(
        "rounded-lg border bg-background p-3 shadow-sm",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          {...listeners}
          {...attributes}
          className="flex flex-1 cursor-grab items-start gap-1 text-left active:cursor-grabbing"
        >
          <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium leading-tight">
            {deal.nome_contato}
          </span>
        </button>
        <Link
          href={`/funil/${deal.id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-3.5" />
          <span className="sr-only">Abrir</span>
        </Link>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Badge variant="outline" className="text-[10px]">
          {ORIGIN_LABEL[deal.origem]}
        </Badge>
        <span className="text-xs font-semibold tabular-nums">
          {formatBRL(deal.valor_estimado)}
        </span>
      </div>
    </div>
  );
}
