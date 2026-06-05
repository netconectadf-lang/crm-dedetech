/**
 * CORS para os endpoints públicos consumidos pela vitrine (site institucional).
 * Libera apenas as origens conhecidas do site Dedetech.
 */
const ALLOWED = new Set<string>([
  "https://dedetech.com.br",
  "https://www.dedetech.com.br",
  "https://dedetech-dedeteck-s-projects.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
]);

export function corsHeaders(origin: string | null): Record<string, string> {
  // allowlist explícita (sem curinga *.vercel.app, que liberava qualquer projeto de terceiros)
  const allow = origin && ALLOWED.has(origin) ? origin : "https://dedetech.com.br";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
