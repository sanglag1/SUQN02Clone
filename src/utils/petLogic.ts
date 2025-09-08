export type PetEvolution = 'egg' | 'baby' | 'teen' | 'adult' | 'master';

export interface PetData {
  level: number;
  evolution: PetEvolution;
  currentActivities: number;
  targetActivities: number;
  happinessPercentage: number;
  name: string;
  isAlive: boolean;
}

export const calculatePetLevel = (totalActivities: number): number => {
  if (totalActivities >= 75) return 5; // 75+ activities = Level 5
  if (totalActivities >= 50) return 4; // 50-74 activities = Level 4  
  if (totalActivities >= 25) return 3; // 25-49 activities = Level 3
  if (totalActivities >= 10) return 2; // 10-24 activities = Level 2
  if (totalActivities >= 1) return 1;  // 1-9 activities = Level 1
  return 1; // 0 activities = Level 1 (default)
};

export const calculatePetEvolution = (totalActivities: number): PetEvolution => {
  if (totalActivities >= 75) return 'master'; // 75+ activities = Master 🦅
  if (totalActivities >= 50) return 'adult';  // 50-74 activities = Adult 🐦
  if (totalActivities >= 25) return 'teen';   // 25-49 activities = Teen 🐤
  if (totalActivities >= 10) return 'baby';   // 10-24 activities = Baby 🐣
  if (totalActivities >= 1) return 'egg';     // 1-9 activities = Egg 🥚
  return 'egg'; // 0 activities = Egg 🥚 (default)
};

export const getTargetActivities = (level: number): number => {
  switch (level) {
    case 1: return 10; // Level 1 cần 10 activities để lên level 2
    case 2: return 25; // Level 2 cần 25 activities để lên level 3
    case 3: return 50; // Level 3 cần 50 activities để lên level 4
    case 4: return 75; // Level 4 cần 75 activities để lên level 5
    case 5: return 75; // Level 5 đã max, giữ nguyên target 75
    default: return 10;
  }
};

export const calculatePetData = (totalActivities: number, currentStreak: number): PetData => {
  const petLevel = calculatePetLevel(totalActivities);
  const petEvolution = calculatePetEvolution(totalActivities);
  const targetActivities = getTargetActivities(petLevel);
  const currentActivities = Math.min(totalActivities, targetActivities);
  const happinessPercentage = (currentActivities / targetActivities) * 100;

  return {
    level: petLevel,
    evolution: petEvolution,
    currentActivities,
    targetActivities,
    happinessPercentage,
    name: 'Chuck Chicken',
    isAlive: currentStreak > 0,
  };
};

export const getPetEmoji = (evolution: PetEvolution, isAlive: boolean): string => {
  if (!isAlive) return '🥚';
  switch (evolution) {
    case 'egg': return '🥚';
    case 'baby': return '🐣';
    case 'teen': return '🐤';
    case 'adult': return '🐦';
    case 'master': return '🦅';
    default: return '🥚';
  }
};

export const getPetEvolutionStages = () => [
  { stage: 'egg' as const, level: 1, emoji: '🥚', name: 'Egg', requirement: '1-9 activities' },
  { stage: 'baby' as const, level: 2, emoji: '🐣', name: 'Baby', requirement: '10-24 activities' },
  { stage: 'teen' as const, level: 3, emoji: '🐤', name: 'Teen', requirement: '25-49 activities' },
  { stage: 'adult' as const, level: 4, emoji: '🐦', name: 'Adult', requirement: '50-74 activities' },
  { stage: 'master' as const, level: 5, emoji: '🦅', name: 'Master', requirement: '75+ activities' },
];
