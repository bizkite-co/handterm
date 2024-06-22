import { useState, useEffect } from 'react';

// Define a type for the achievement
export type Achievement = {
  phrase: string;
  prompt: string;
  unlocked: boolean;
};

// Custom hook to manage achievements
export function useAchievements(initialAchievements: Achievement[]) {
  // State to hold the achievements
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Load achievements from localStorage on component mount
  useEffect(() => { 
    const storedAchievements = localStorage.getItem('achievements');
    if (storedAchievements) {
      setAchievements(JSON.parse(storedAchievements));
    } else {
      setAchievements(initialAchievements);
    }
  }, []);

  // Save achievements to localStorage when they change
  useEffect(() => { // setAchievements
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }, [achievements]);

  // Function to unlock an achievement
  const unlockAchievement = (name: string) => {
    setAchievements((prevAchievements) =>
      prevAchievements.map((ach) =>
        ach.phrase === name ? { ...ach, unlocked: true } : ach
      )
    );
  };

  return { achievements, unlockAchievement };
}
