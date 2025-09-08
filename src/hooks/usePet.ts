import { useMemo } from 'react';
import { calculatePetData, PetData } from '@/utils/petLogic';

interface UsePetProps {
  totalActivities: number;
  currentStreak: number;
}

export const usePet = ({ totalActivities, currentStreak }: UsePetProps): PetData => {
  return useMemo(() => {
    return calculatePetData(totalActivities, currentStreak);
  }, [totalActivities, currentStreak]);
};
