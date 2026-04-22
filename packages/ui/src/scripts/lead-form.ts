import { formatRuPhone, type PhoneRegion } from '@landings/leads/phone';
import type { LeadResponse } from '@landings/leads';
import { validateLead, type FieldError, type FormValues } from '../lib/validate';
import { trackGoal } from './analytics';
import { LEAD_CONTEXT_EVENT, type LeadContextDetail } from './lead-context';

interface FormConfig {
  site: string;
  locale: string;
  endpoint: string;
  text: {
    errors: Record<FieldError, string>;
    rateLimited: string;
    failed: string;
    offline: string;
    sending: string;
  };
}

const FIELDS: (keyof FormValues)[] = ['name', 'phone', 'message', 'consent'];

function setupForm(form: HTMLFormElement): void {
  const config = JSON.parse(form.dataset.config ?? '{}') as FormConfig;
  const region: PhoneRegion = config.locale === 'ru' ? 'ru' : 'intl';
  const formId = form.dataset.formId ?? 'main';
  const root = form.closest<HTMLElement>('[data-lead-root]') ?? form;
  const phone = form.querySelector<HTMLInputElement>('input[name="phone"]');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const status = form.querySelector<HTMLElement>('[data-lf-status]');
  const contextBox = form.querySelector<HTMLElement>('[data-lf-context]');
  const contextText = form.querySelector<HTMLElement>('[data-lf-context-text]');
  let context: Record<string, string> = {};
  let busy = false;

  if (phone && region === 'ru') {
    phone.addEventListener('input', () => {
      const atEnd = phone.selectionStart === phone.value.length;
      phone.value = formatRuPhone(phone.value);
      if (atEnd) phone.setSelectionRange(phone.value.length, phone.value.length);
    });
    phone.addEventListener('blur', () => {
      if (phone.value === '+7 (') phone.value = '';
    });
  }

  const fieldError = (name: keyof FormValues) =>
    form.querySelector<HTMLElement>(`[data-lf-error="${name}"]`);
  const input = (name: keyof FormValues) =>
    form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);

  function showErrors(errors: Partial<Record<keyof FormValues, string>>): void {
    for (const name of FIELDS) {
      const message = errors[name];
      const el = input(name);
      const slot = fieldError(name);
      el?.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (slot) slot.textContent = message ?? '';
    }
    const first = FIELDS.find((name) => errors[name]);
    if (first) input(first)?.focus();
  }

  function setStatus(message: string): void {
    if (status) status.textContent = message;
  }

  function setBusy(value: boolean): void {
    busy = value;
    form.setAttribute('aria-busy', String(value));
    if (!submit) return;
    submit.disabled = value;
    const label = submit.querySelector<HTMLElement>('[data-lf-label]');
    if (label) {
      label.dataset.idle ??= label.textContent ?? '';
      label.textContent = value ? config.text.sending : label.dataset.idle;
    }
  }

  function values(): FormValues {
    const data = new FormData(form);
    return {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      message: String(data.get('message') ?? ''),
      consent: data.get('consent') === 'on',
    };
  }

  // Clear a field's error while the visitor types, not on blur: a message
  // vanishing on blur shifts the layout right under the next click.
  for (const name of FIELDS) {
    input(name)?.addEventListener(name === 'consent' ? 'change' : 'input', () => {
      const error = validateLead(values(), region)[name];
      if (!error) {
        input(name)?.setAttribute('aria-invalid', 'false');
        const slot = fieldError(name);
        if (slot) slot.textContent = '';
      }
    });
  }

  document.addEventListener(LEAD_CONTEXT_EVENT, (event) => {
    const detail = (event as CustomEvent<LeadContextDetail>).detail;
    if (detail.formId !== formId) return;
    context = detail.context;
    if (contextBox && contextText) {
      contextText.textContent = detail.summary;
      contextBox.hidden = false;
    }
    if (detail.focus) {
      root.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
      const firstEmpty = (['name', 'phone'] as const).map(input).find((el) => el && !el.value);
      (firstEmpty ?? input('name'))?.focus({ preventScroll: true });
    }
  });

  form.querySelector('[data-lf-context-clear]')?.addEventListener('click', () => {
    context = {};
    if (contextBox) contextBox.hidden = true;
  });

  root.querySelector('[data-lf-again]')?.addEventListener('click', () => {
    form.reset();
    root.dataset.state = 'idle';
    input('name')?.focus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (busy) return;
    setStatus('');

    const current = values();
    const errors = validateLead(current, region);
    if (Object.keys(errors).length > 0) {
      showErrors(
        Object.fromEntries(
          Object.entries(errors).map(([key, code]) => [key, config.text.errors[code]]),
        ),
      );
      return;
    }
    showErrors({});

    const honeypot = form.querySelector<HTMLInputElement>('[data-lf-trap]');
    const payload = {
      site: config.site,
      locale: config.locale,
      ...current,
      context: { source: form.dataset.source ?? formId, ...context },
      website: honeypot?.value ?? '',
      elapsedMs: Math.round(performance.now()),
      page: location.href.slice(0, 300),
    };

    setBusy(true);
    void send(payload).finally(() => {
      setBusy(false);
    });
  });

  async function send(payload: object): Promise<void> {
    if (!navigator.onLine) {
      setStatus(config.text.offline);
      return;
    }
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as LeadResponse;

      if (body.ok) {
        root.dataset.state = 'success';
        root.querySelector<HTMLElement>('[data-lf-success]')?.focus();
        trackGoal('lead_submit', { site: config.site, form: formId });
        return;
      }
      if (body.error === 'validation') {
        showErrors(
          Object.fromEntries(
            Object.entries(body.fields).map(([key, code]) => [
              key,
              config.text.errors[code as FieldError] ?? config.text.failed,
            ]),
          ),
        );
        return;
      }
      setStatus(body.error === 'rate_limited' ? config.text.rateLimited : config.text.failed);
    } catch {
      setStatus(navigator.onLine ? config.text.failed : config.text.offline);
    }
  }
}

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-lead-form]')) {
  setupForm(form);
}
