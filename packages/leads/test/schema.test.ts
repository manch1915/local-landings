import { describe, expect, it } from 'vitest';
import { leadInputSchema } from '../src/schema';

const base = {
  site: 'repair',
  name: 'Ирина',
  phone: '+7 (912) 345-67-89',
  consent: true,
};

describe('leadInputSchema', () => {
  it('normalizes the phone and fills defaults', () => {
    const lead = leadInputSchema.parse(base);
    expect(lead.phone).toBe('+79123456789');
    expect(lead.locale).toBe('ru');
    expect(lead.message).toBe('');
    expect(lead.context).toEqual({});
  });

  it('keeps calculator answers in context', () => {
    const lead = leadInputSchema.parse({
      ...base,
      context: { area: '54 м²', level: 'Капитальный' },
    });
    expect(lead.context.area).toBe('54 м²');
  });

  it('reports field codes that the form can translate', () => {
    const result = leadInputSchema.safeParse({ ...base, name: 'И', phone: '123', consent: false });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map(
      (issue) => `${issue.path.join('.')}:${issue.message}`,
    );
    expect(messages).toContain('name:name_short');
    expect(messages).toContain('consent:consent_required');
  });

  it('rejects a phone that only passes the length check', () => {
    const result = leadInputSchema.safeParse({ ...base, phone: '+7 (912) 34' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('phone_invalid');
  });

  it('uses international rules on the English page', () => {
    const lead = leadInputSchema.parse({
      ...base,
      site: 'tutor',
      locale: 'en',
      phone: '+44 20 7946 0958',
    });
    expect(lead.phone).toBe('+442079460958');
  });

  it('rejects unknown sites', () => {
    expect(leadInputSchema.safeParse({ ...base, site: 'bakery' }).success).toBe(false);
  });
});
