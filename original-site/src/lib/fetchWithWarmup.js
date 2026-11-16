/** Only idempotent GET retries. Never replay POST/PUT/PATCH. */
export async function fetchJsonWithWarmup(url, options = {}, config = {}) {
  if ((options?.method || 'GET').toUpperCase() !== 'GET') {
    throw new Error('Otomatik tekrar yalnızca GET isteklerinde kullanılabilir.');
  }
  const attempts = Math.max(1, Math.min(5, config.attempts ?? 4));
  const fetchImpl = config.fetchImpl ?? fetch;
  const sleep = config.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetchImpl(url, options);
      if (!response.ok) {
        const error = new Error('Veri sunucusu yanıt vermedi (HTTP ' + response.status + ').');
        error.retryable = [502,503,504].includes(response.status);
        throw error;
      }
      return await response.json();
    } catch (error) {
      if (error?.retryable === false || i === attempts - 1) throw error;
      config.onRetry?.(i + 1, attempts);
      await sleep(4000 * (i + 1));
    }
  }
}
