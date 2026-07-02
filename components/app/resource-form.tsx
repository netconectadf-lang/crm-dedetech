"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, ScanLine } from "lucide-react";

import type { SaveState } from "@/lib/crud-helpers";
import { maskCpfCnpj, maskPhone, maskCurrency } from "@/lib/format";
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
  | "cnpj"
  | "cpf"
  | "telefone"
  | "currency";

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
  docOcr = false,
}: {
  fields: Field[];
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  defaultValues?: Values;
  submitLabel?: string;
  onSuccess?: () => void;
  /** Mostra o botão "ler documento (CNH/RG)" que preenche os campos via IA. */
  docOcr?: boolean;
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    action,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

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

  async function handleDocumento(file: File) {
    setOcrLoading(true);
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      // só campos de texto/data/e-mail (não envia salário/valor nem selects)
      const campos = fields
        .filter((f) => !f.type || ["text", "date", "email"].includes(f.type))
        .map((f) => ({ name: f.name, label: f.label, type: f.type }));
      const res = await fetch("/api/ocr/documento", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: file.type, campos }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error ?? "Não consegui ler o documento.");
        return;
      }
      const valores: Record<string, string> = d.valores ?? {};
      const n = Object.keys(valores).length;
      if (!n) {
        toast.message("Não consegui extrair dados do documento.");
        return;
      }
      for (const [name, value] of Object.entries(valores)) setField(name, value);
      toast.success(`${n} campo(s) preenchido(s) do documento — confira antes de salvar.`);
    } catch {
      toast.error("Falha ao ler o documento.");
    } finally {
      setOcrLoading(false);
    }
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
      {docOcr && (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-sm transition-colors hover:bg-primary/10">
          {ocrLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
          ) : (
            <ScanLine className="size-4 shrink-0 text-primary" />
          )}
          <span className="flex-1">
            {ocrLoading
              ? "Lendo documento…"
              : "Ler documento (CNH/RG) e preencher automaticamente"}
            <span className="block text-xs text-muted-foreground">
              Foto nítida ou PDF. O salário não é preenchido — confira os dados.
            </span>
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            disabled={ocrLoading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleDocumento(f);
              e.target.value = "";
            }}
          />
        </label>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <FieldControl
            key={f.name}
            field={f}
            defaultValue={defaultValues?.[f.name]}
            error={state?.fieldErrors?.[f.name]}
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
  error,
  onCep,
  onCnpj,
}: {
  field: Field;
  defaultValue: unknown;
  error?: string;
  onCep: (v: string) => void;
  onCnpj: (v: string) => void;
}) {
  const type = f.type ?? "text";
  const dv = defaultValue == null ? "" : String(defaultValue);
  const wrap = f.full || type === "textarea" ? "sm:col-span-2" : "";
  const errId = error ? `${f.name}-erro` : undefined;

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
        <Textarea
          id={f.name}
          name={f.name}
          defaultValue={dv}
          placeholder={f.placeholder}
          aria-invalid={!!error}
          aria-describedby={errId}
        />
      ) : type === "select" ? (
        <Select name={f.name} defaultValue={dv || f.options?.[0]?.value}>
          <SelectTrigger id={f.name} aria-invalid={!!error} aria-describedby={errId}>
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
      ) : type === "currency" ? (
        <CurrencyField name={f.name} defaultValue={dv} placeholder={f.placeholder} required={f.required} error={!!error} errId={errId} />
      ) : type === "cpf" || type === "telefone" ? (
        <MaskedField
          name={f.name}
          defaultValue={dv}
          placeholder={f.placeholder}
          required={f.required}
          mask={type === "cpf" ? maskCpfCnpj : maskPhone}
          inputMode="numeric"
          error={!!error}
          errId={errId}
        />
      ) : (
        <Input
          id={f.name}
          name={f.name}
          type={type === "number" ? "number" : type === "email" ? "email" : type === "date" ? "date" : "text"}
          step={type === "number" ? "any" : undefined}
          defaultValue={dv}
          placeholder={f.placeholder}
          required={f.required}
          aria-invalid={!!error}
          aria-describedby={errId}
          onBlur={
            type === "cep"
              ? (e) => onCep(e.target.value)
              : type === "cnpj"
                ? (e) => onCnpj(e.target.value)
                : undefined
          }
        />
      )}
      {error && (
        <p id={errId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Input com máscara ao vivo (CPF/telefone). Envia o texto mascarado; os
 * schemas normalizam para dígitos no submit. */
function MaskedField({
  name,
  defaultValue,
  placeholder,
  required,
  mask,
  inputMode,
  error,
  errId,
}: {
  name: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
  mask: (v: string) => string;
  inputMode?: "numeric" | "text";
  error?: boolean;
  errId?: string;
}) {
  const [val, setVal] = useState(defaultValue ? mask(defaultValue) : "");
  return (
    <Input
      id={name}
      name={name}
      value={val}
      placeholder={placeholder}
      required={required}
      inputMode={inputMode}
      aria-invalid={error}
      aria-describedby={errId}
      onChange={(e) => setVal(mask(e.target.value))}
    />
  );
}

/** Campo de moeda: input mascarado visível + hidden com o valor numérico
 * (ex.: "1.234,56" na tela, "1234.56" no FormData p/ o zod). */
function CurrencyField({
  name,
  defaultValue,
  placeholder,
  required,
  error,
  errId,
}: {
  name: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  errId?: string;
}) {
  const inicial = defaultValue ? maskCurrency(String(Math.round(Number(defaultValue) * 100))) : "";
  const [val, setVal] = useState(inicial);
  const numerico = val ? String(Number(val.replace(/\./g, "").replace(",", ".")) || 0) : "";
  return (
    <>
      <input type="hidden" name={name} value={numerico} />
      <Input
        id={name}
        value={val}
        placeholder={placeholder ?? "0,00"}
        required={required}
        inputMode="numeric"
        aria-invalid={error}
        aria-describedby={errId}
        onChange={(e) => setVal(maskCurrency(e.target.value))}
      />
    </>
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
