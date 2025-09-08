import React from 'react';
import { usePet } from '@/hooks/usePet';
import { getPetEmoji } from '@/utils/petLogic';
import { Button } from '@/components/ui/button';

interface PetDisplayProps {
  totalActivities: number;
  currentStreak: number;
  onShowDetails?: () => void;
  compact?: boolean;
}

export const PetDisplay: React.FC<PetDisplayProps> = ({
  totalActivities,
  currentStreak,
  onShowDetails,
  compact = false
}) => {
  const petData = usePet({ totalActivities, currentStreak });

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center px-2">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5 w-32">
          <div className="text-3xl mb-1 text-center">
            {getPetEmoji(petData.evolution, petData.isAlive)}
          </div>
          <h3 className="text-sm font-bold mb-1 text-center truncate">{petData.name}</h3>
          <p className="text-xs opacity-80 mb-1 text-center">
            Level {petData.level} • {petData.evolution}
          </p>
          <div className="mb-1">
            <div className="flex justify-between text-xs mb-0.5">
              <span>Progress</span>
              <span>{petData.currentActivities}/{petData.targetActivities}</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${petData.happinessPercentage}%` }}
              />
            </div>
          </div>
          {onShowDetails && (
            <Button
              onClick={onShowDetails}
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs px-2 py-1 mt-1 w-full"
            >
              Pet Details
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center mb-6">
      <div className="text-8xl mb-4">{getPetEmoji(petData.evolution, petData.isAlive)}</div>
      <h4 className="text-2xl font-bold mb-2">{petData.name}</h4>
      <p className="text-gray-600">
        Level {petData.level} • {petData.evolution}
      </p>
      <div className="mt-4">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Progress</span>
          <span>{petData.currentActivities}/{petData.targetActivities}</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${petData.happinessPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {totalActivities} activities completed • {petData.targetActivities - petData.currentActivities} more to next level
        </p>
      </div>
    </div>
  );
};
