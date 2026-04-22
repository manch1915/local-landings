import type { Locale } from '@landings/leads';

export interface FormText {
  name: string;
  namePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  message: string;
  messagePlaceholder: string;
  consent: string;
  consentLink: string;
  submit: string;
  sending: string;
  contextLabel: string;
  contextClear: string;
  errors: Record<
    'name_short' | 'name_long' | 'phone_invalid' | 'message_long' | 'consent_required',
    string
  >;
  rateLimited: string;
  failed: string;
  offline: string;
  successTitle: string;
  successText: string;
  successAgain: string;
}

export const FORM_TEXT: Record<Locale, FormText> = {
  ru: {
    name: 'Имя',
    namePlaceholder: 'Как к вам обращаться',
    phone: 'Телефон',
    phonePlaceholder: '+7 (___) ___-__-__',
    message: 'Комментарий',
    messagePlaceholder: 'Необязательно',
    consent: 'Согласен на обработку персональных данных по',
    consentLink: 'политике конфиденциальности',
    submit: 'Отправить заявку',
    sending: 'Отправляем…',
    contextLabel: 'К заявке приложим',
    contextClear: 'Убрать',
    errors: {
      name_short: 'Напишите имя, хотя бы две буквы',
      name_long: 'Имя слишком длинное, сократите до 80 символов',
      phone_invalid: 'Проверьте номер: нужно 10 цифр после +7',
      message_long: 'Комментарий длиннее 1000 символов, сократите его',
      consent_required: 'Без согласия мы не можем принять заявку',
    },
    rateLimited:
      'Заявок с этого устройства слишком много. Попробуйте через несколько минут или напишите в мессенджер.',
    failed:
      'Заявка не ушла из-за сбоя на нашей стороне. Напишите в мессенджер или позвоните, ответим сразу.',
    offline: 'Нет связи с интернетом. Проверьте подключение и отправьте ещё раз.',
    successTitle: 'Заявка принята',
    successText: 'Перезвоним в течение 15 минут в рабочее время.',
    successAgain: 'Отправить ещё одну',
  },
  en: {
    name: 'Name',
    namePlaceholder: 'What should we call you',
    phone: 'Phone',
    phonePlaceholder: '+44 20 7946 0958',
    message: 'Message',
    messagePlaceholder: 'Optional',
    consent: 'I agree to the processing of my personal data under the',
    consentLink: 'privacy policy',
    submit: 'Send request',
    sending: 'Sending…',
    contextLabel: 'Attached to your request',
    contextClear: 'Remove',
    errors: {
      name_short: 'Enter your name, at least two letters',
      name_long: 'Name is too long, keep it under 80 characters',
      phone_invalid: 'Check the number and include the country code',
      message_long: 'Message is over 1000 characters, please shorten it',
      consent_required: 'We can only accept the request with your consent',
    },
    rateLimited: 'Too many requests from this device. Try again in a few minutes or message us.',
    failed:
      'The request did not go through because of an error on our side. Message us instead and we will reply right away.',
    offline: 'You are offline. Check the connection and send again.',
    successTitle: 'Request received',
    successText: 'We will get back to you within a few hours.',
    successAgain: 'Send another one',
  },
};
