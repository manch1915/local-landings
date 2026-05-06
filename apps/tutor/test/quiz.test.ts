import { describe, expect, it } from 'vitest';
import { nextStep, recommend, steps, type Pricing } from '../src/lib/quiz';

const pricing: Pricing = {
  courses: [
    { id: 'speaking', price: 2200 },
    { id: 'business', price: 2500 },
    { id: 'ielts', price: 2800 },
    { id: 'school', price: 2200 },
    { id: 'teens', price: 2000 },
    { id: 'club', price: 900 },
  ],
  pairShare: 0.65,
  packageDiscount: 0.1,
};

describe('quiz flow', () => {
  it('asks about the exam instead of the level', () => {
    expect(steps({ goal: 'exam' })).toEqual(['goal', 'exam', 'format', 'perWeek']);
  });

  it('skips the format question for kids', () => {
    expect(steps({ goal: 'kid' })).toEqual(['goal', 'level', 'perWeek']);
  });

  it('returns the first unanswered step', () => {
    expect(nextStep({})).toBe('goal');
    expect(nextStep({ goal: 'work' })).toBe('level');
    expect(nextStep({ goal: 'work', level: 'middle', format: 'solo', perWeek: 2 })).toBeNull();
  });
});

describe('recommend', () => {
  it('sends working professionals to the business course', () => {
    const result = recommend(
      { goal: 'work', level: 'middle', format: 'solo', perWeek: 2 },
      pricing,
    );
    expect(result).toEqual({
      course: 'business',
      perWeek: 2,
      lessonPrice: 2500,
      monthly: 18_000,
      adjusted: false,
    });
  });

  it('starts beginners with general speaking even if they need English for work', () => {
    expect(recommend({ goal: 'work', level: 'zero', format: 'solo' }, pricing).course).toBe(
      'speaking',
    );
  });

  it('moves beginners out of the club and says so', () => {
    const result = recommend({ goal: 'travel', level: 'zero', format: 'club' }, pricing);
    expect(result.course).toBe('speaking');
    expect(result.adjusted).toBe(true);
  });

  it('charges each student a share of the price in a pair', () => {
    const result = recommend({ goal: 'exam', exam: 'ielts', format: 'pair', perWeek: 1 }, pricing);
    expect(result.lessonPrice).toBe(1820);
    expect(result.monthly).toBe(6_600);
  });

  it('rounds dollar prices finer than rubles', () => {
    const usd: Pricing = { ...pricing, courses: [{ id: 'speaking', price: 30 }] };
    const result = recommend({ goal: 'travel', level: 'basic', format: 'pair', perWeek: 3 }, usd);
    expect(result.lessonPrice).toBe(20);
    expect(result.monthly).toBe(220);
  });

  it('routes school exams and kids to their own courses', () => {
    expect(recommend({ goal: 'exam', exam: 'school' }, pricing).course).toBe('school');
    expect(recommend({ goal: 'kid', level: 'basic', perWeek: 3 }, pricing)).toMatchObject({
      course: 'teens',
      monthly: 21_600,
    });
  });
});
