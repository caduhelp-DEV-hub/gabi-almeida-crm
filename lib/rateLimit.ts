// Limitador de tentativas em memoria.
// O app roda como servidor Node unico (next.config.ts usa output: 'standalone'),
// entao um contador em memoria e suficiente e nao exige Redis.
// Observacao: os contadores zeram quando o servidor reinicia.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 10_000;

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitStatus {
  limited: boolean;
  retryAfterSeconds: number;
}

/** Verifica se a chave ja estourou o limite, sem contar mais uma tentativa. */
export function checkLimit(key: string, limit: number): RateLimitStatus {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { limited: true, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

/** Conta uma tentativa que falhou. A janela comeca na primeira falha. */
export function registerFailure(key: string, windowMs: number): void {
  const now = Date.now();

  if (buckets.size >= MAX_BUCKETS) prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
}

/** Limpa o contador apos um acesso bem-sucedido. */
export function clearFailures(key: string): void {
  buckets.delete(key);
}

/**
 * IP do cliente considerando proxy reverso.
 * Usa o primeiro endereco de x-forwarded-for, que e o do cliente original.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() || 'desconhecido';
}
