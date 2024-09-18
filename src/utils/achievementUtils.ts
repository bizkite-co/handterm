import { Achievement, Achievements } from "../types/Types";

export const loadTutorialAchievements = (): string[] => {
    const storedAchievements = localStorage.getItem('achievements');
    return storedAchievements ? JSON.parse(storedAchievements) : [];
}

export const saveAchievements = (achievementPhrase: string) => {
    const storedAchievementString: string = localStorage.getItem('achievements') || '';
    const storedAchievements: string[] = storedAchievementString ? JSON.parse(storedAchievementString) : [];
    // Don't add duplicate achievements
    if (storedAchievements.includes(achievementPhrase)) return;
    storedAchievements.push(achievementPhrase);
    localStorage.setItem('achievements', JSON.stringify(storedAchievements));
}

export const getNextTutorialAchievement = () => {
    const unlockedAchievements = loadTutorialAchievements() || [];
    const nextAchievement = Achievements
        .find(a => !unlockedAchievements.some(ua => ua === a.phrase.join('')));
    return nextAchievement || null;
}

export const unlockAchievementUtil = (command: string, achievement: string): Achievement | null => {
    if (command === '') command = 'Return (ENTER)';
    if (achievement === command) {
        saveAchievements(command);
        return getNextTutorialAchievement();
    }
    return null;
}

export const resetTutorial = () => {
    localStorage.removeItem('achievements');
}

