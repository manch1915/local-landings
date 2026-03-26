export type FetchLike = typeof fetch;

export class ChannelError extends Error {
  constructor(
    readonly channel: string,
    message: string,
  ) {
    super(`${channel}: ${message}`);
    this.name = 'ChannelError';
  }
}

/** POST JSON with a timeout and return the parsed body or throw a ChannelError. */
export async function postJson<T>(
  fetchFn: FetchLike,
  channel: string,
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
  timeoutMs = 8000,
): Promise<T> {
  let response: Response;
  try {
    response = await fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new ChannelError(channel, `request failed: ${String(error)}`);
  }

  const text = await response.text();
  if (!response.ok) {
    throw new ChannelError(channel, `HTTP ${response.status} ${text.slice(0, 300)}`);
  }
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new ChannelError(channel, 'response is not JSON');
  }
}
