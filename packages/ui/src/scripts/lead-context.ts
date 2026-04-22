export interface LeadContextDetail {
  formId: string;
  /** Machine-friendly answers that go to the CRM, e.g. { area: '54 м²' }. */
  context: Record<string, string>;
  /** One line shown above the form so the visitor sees what is attached. */
  summary: string;
  /** Scroll to the form and focus the first empty field. */
  focus?: boolean;
}

export const LEAD_CONTEXT_EVENT = 'lead:context';

/** Attach quiz, calculator or schedule answers to a lead form on the page. */
export function setLeadContext(detail: LeadContextDetail): void {
  document.dispatchEvent(new CustomEvent<LeadContextDetail>(LEAD_CONTEXT_EVENT, { detail }));
}
