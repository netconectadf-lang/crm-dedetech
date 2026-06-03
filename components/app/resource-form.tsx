"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import type { SaveState } from "@/lib/crud-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "switch"
  | "cep"
  | "cnpj";

export type Field = {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  full?: boolean; // ocupa as 2 colunas
  required?: boolean;
};

type Values = Record<string, unknown>;

export function ResourceForm({
  fields,
  action,
  defaultValues,
  submitLabel = "Salvar",
  onSuccess,
}: {
  fields: Field[];
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  defaultValues?: Values;
  submitLabel?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    action,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      onSuccess?.();
    }
    if (state?.error) toast.error(state.error);
  }, [state, onSuccess]);

  function setField(name: string, value: string) {
    const el = formRef.current?.elements.namedItem(name) as
      | HTMLInputElement
      | null;
    if (el) el.value = value;
  }

  async function handleCep(cep: string) {
    const res = await fetch(`/api/lookup/cep?cep=${cep}`);
    if (!res.ok) return;
    const d = await res.json();
    setField("logradouro", d.logradouro);
    setField("bairro", d.bairro);
    setField("cidade", d.cidade);
    setField("uf", d.uf);
    setField("codigo_ibge", d.codigo_ibge);
  }

  async function handleCnpj(cnpj: string) {
    const res = await fetch(`/api/lookup/cnpj?cnpj=${cnpj}`);
    if (!res.ok) return;
    const d = await res.json();
    setField("razao_social", d.razao_social);
    setField("nome_fantasia", d.nome_fantasia);
    setField("email", d.email);
    setField("telefone", d.telefone);
    setField("cep", d.cep);
    setField("logradouro", d.logradouro);
    setField("numero", d.numero);
    setField("bairro", d.bairro);
    setField("cidade", d.cidade);
    setField("uf", d.uf);
    toast.success("Dados do CNPJ preenchidos.");
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <FieldControl
            key={f.name}
            field={f}
            defaultValue={defaultValues?.[f.name]}
            onCep={handleCep}
            onCnpj={handleCnpj}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FieldControl({
  field: f,
  defaultValue,
  onCep,
  onCnpj,
}: {
  field: Field;
  defaultValue: unknown;
  onCep: (v: string) => void;
  onCnpj: (v: string) => void;
}) {
  const type = f.type ?? "text";
  const dv = defaultValue == null ? "" : String(defaultValue);
  const wrap = f.full || type === "textarea" ? "sm:col-span-2" : "";

  if (type === "switch") {
    return (
      <div className={`flex items-center justify-between rounded-lg border p-3 ${wrap}`}>
        <Label htmlFor={f.name}>{f.label}</Label>
        <SwitchField name={f.name} defaultChecked={defaultValue !== false} />
      </div>
    );
  }

  return (
    <div className={`grid gap-2 ${wrap}`}>
      <Label htmlFor={f.name}>
        {f.label}
        {f.required && <span className="text-destructive"> *</span>}
      </Label>
      {type === "textarea" ? (
        <Textarea id={f.name} name={f.name} defaultValue={dv} placeholder={f.placeholder} />
      ) : type === "select" ? (
        <Select name={f.name} defaultValue={dv || f.options?.[0]?.value}>
          <SelectTrigger id={f.name}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {f.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={f.name}
          name={f.name}
          type={type === "number" ? "number" : type === "email" ? "email" : type === "date" ? "date" : "text"}
          step={type === "number" ? "any" : undefined}
          defaultValue={dv}
          placeholder={f.placeholder}
          required={f.required}
          onBlur={
            type === "cep"
              ? (e) => onCep(e.target.value)
              : type === "cnpj"
                ? (e) => onCnpj(e.target.value)
                : undefined
          }
        />
      )}
    </div>
  );
}

/** Switch que envia o valor via input hidden (FormData). */
function SwitchField({
  name,
  defaultChecked,
}: {
  name: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <>
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <Switch checked={checked} onCheckedChange={setChecked} />
    </>
  );
}
