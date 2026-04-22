export interface BusinessInfo {
  type: 'LocalBusiness' | 'HomeAndConstructionBusiness' | 'ExerciseGym' | 'EducationalOrganization';
  name: string;
  description: string;
  url: string;
  telephone: string;
  image: string;
  priceRange?: string;
  address?: {
    street: string;
    city: string;
    region?: string;
    postalCode?: string;
    country: string;
  };
  geo?: { lat: number; lon: number };
  areaServed?: string;
  /** e.g. [{ days: ['Mo','Tu'], opens: '09:00', closes: '20:00' }] */
  hours?: { days: string[]; opens: string; closes: string }[];
  sameAs?: string[];
  rating?: { value: number; count: number };
}

const DAY_NAMES: Record<string, string> = {
  Mo: 'Monday',
  Tu: 'Tuesday',
  We: 'Wednesday',
  Th: 'Thursday',
  Fr: 'Friday',
  Sa: 'Saturday',
  Su: 'Sunday',
};

export function localBusiness(info: BusinessInfo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': info.type,
    '@id': `${info.url}#business`,
    name: info.name,
    description: info.description,
    url: info.url,
    telephone: info.telephone,
    image: info.image,
    ...(info.priceRange && { priceRange: info.priceRange }),
    ...(info.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: info.address.street,
        addressLocality: info.address.city,
        ...(info.address.region && { addressRegion: info.address.region }),
        ...(info.address.postalCode && { postalCode: info.address.postalCode }),
        addressCountry: info.address.country,
      },
    }),
    ...(info.geo && {
      geo: { '@type': 'GeoCoordinates', latitude: info.geo.lat, longitude: info.geo.lon },
    }),
    ...(info.areaServed && { areaServed: info.areaServed }),
    ...(info.hours && {
      openingHoursSpecification: info.hours.map((slot) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: slot.days.map((day) => DAY_NAMES[day] ?? day),
        opens: slot.opens,
        closes: slot.closes,
      })),
    }),
    ...(info.sameAs?.length && { sameAs: info.sameAs }),
    ...(info.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: info.rating.value,
        reviewCount: info.rating.count,
      },
    }),
  };
}

export function faqPage(items: { question: string; answer: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
