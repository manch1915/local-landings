declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string>) => void };
    ym?: (id: number, method: string, goal: string, params?: Record<string, string>) => void;
    __ymId?: number;
  }
}

/** Sends a goal to whatever counters the page has. Never throws. */
export function trackGoal(event: string, data: Record<string, string> = {}): void {
  try {
    window.umami?.track(event, data);
    if (window.ym && window.__ymId) window.ym(window.__ymId, 'reachGoal', event, data);
  } catch {
    // Blocked or half-loaded counters must not break the form.
  }
}
