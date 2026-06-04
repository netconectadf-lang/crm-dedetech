import "server-only";

/**
 * Extrai o texto de um PDF (Buffer/Uint8Array) usando unpdf — puro-JS,
 * sem binário nativo, roda em serverless/edge. Páginas mescladas.
 */
export async function extractPdfText(
  data: Uint8Array | ArrayBuffer,
): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}
