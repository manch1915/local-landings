export type Goal = 'work' | 'relocation' | 'exam' | 'kid' | 'travel';
export type Level = 'zero' | 'basic' | 'middle' | 'confident';
export type Exam = 'ielts' | 'school';
export type Format = 'solo' | 'pair' | 'club';
export type CourseId = 'speaking' | 'business' | 'ielts' | 'school' | 'teens' | 'club';

export interface Answers {
  goal?: Goal;
  /** Asked instead of the level when the goal is an exam. */
  exam?: Exam;
  level?: Level;
  format?: Format;
  perWeek?: 1 | 2 | 3;
}

export type StepId = 'goal' | 'exam' | 'level' | 'format' | 'perWeek';

export interface CoursePrice {
  id: CourseId;
  /** Price of one lesson for one student. */
  price: number;
}

export interface Pricing {
  courses: CoursePrice[];
  /** Each student in a pair pays this share of the solo price. */
  pairShare: number;
  /** Discount for a monthly package, 0.1 = 10%. */
  packageDiscount: number;
}

export interface Recommendation {
  course: CourseId;
  perWeek: number;
  lessonPrice: number;
  monthly: number;
  /** True when a club fits better than the requested solo lessons, or vice versa. */
  adjusted: boolean;
}

/** The order of questions depends on earlier answers. */
export function steps(answers: Answers): StepId[] {
  if (answers.goal === 'exam') return ['goal', 'exam', 'format', 'perWeek'];
  if (answers.goal === 'kid') return ['goal', 'level', 'perWeek'];
  return ['goal', 'level', 'format', 'perWeek'];
}

export function nextStep(answers: Answers): StepId | null {
  return steps(answers).find((step) => answers[step] === undefined) ?? null;
}

function pickCourse(answers: Answers): { course: CourseId; adjusted: boolean } {
  const { goal, exam, level, format } = answers;

  if (goal === 'exam') return { course: exam === 'school' ? 'school' : 'ielts', adjusted: false };
  if (goal === 'kid') return { course: 'teens', adjusted: false };

  // A group only helps once there is something to talk with; beginners go solo first.
  if (format === 'club') {
    return level === 'zero'
      ? { course: 'speaking', adjusted: true }
      : { course: 'club', adjusted: false };
  }
  if (goal === 'work' && level !== 'zero') return { course: 'business', adjusted: false };
  return { course: 'speaking', adjusted: false };
}

export function recommend(answers: Answers, pricing: Pricing): Recommendation {
  const { course, adjusted } = pickCourse(answers);
  const perWeek = answers.perWeek ?? 2;
  const base = pricing.courses.find((item) => item.id === course)?.price ?? 0;

  const isPair = answers.format === 'pair' && course !== 'club' && course !== 'teens';
  // Rubles round to tens and hundreds, dollars to whole units and tens.
  const step = base >= 500 ? 10 : 1;
  const lessonPrice = Math.round((isPair ? base * pricing.pairShare : base) / step) * step;
  const monthly =
    Math.round((lessonPrice * perWeek * 4 * (1 - pricing.packageDiscount)) / (step * 10)) *
    step *
    10;

  return { course, perWeek, lessonPrice, monthly, adjusted };
}
