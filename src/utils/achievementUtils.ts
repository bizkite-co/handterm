import { TutorialAchievement, TutorialAchievements } from "../types/Types";

export const loadTutorialAchievements = (): string[] => {
    const storedAchievements = localStorage.getItem('tutorialAchievements');
    return storedAchievements ? JSON.parse(storedAchievements) : [];
}

export const saveAchievements = (achievementPhrase: string) => {
    const storedAchievementString: string = localStorage.getItem('tutorialAchievements') || '';
    const storedAchievements: string[] = storedAchievementString ? JSON.parse(storedAchievementString) : [];
    // Don't add duplicate tutorialAchievements
    if (storedAchievements.includes(achievementPhrase)) return;
    storedAchievements.push(achievementPhrase);
    localStorage.setItem('tutorialAchievements', JSON.stringify(storedAchievements));
}

export const getNextTutorialAchievement = ():TutorialAchievement | null => {
    const unlockedAchievements = loadTutorialAchievements() || [];
    const nextAchievement = TutorialAchievements
        .find(a => !unlockedAchievements.some(ua => ua === a.phrase.join('')));
    return nextAchievement || null;
}

export const unlockAchievement = (command: string, achievement: string): TutorialAchievement | null => {
    if (command === '') command = 'Return (ENTER)';
    if (achievement === command) {
        saveAchievements(command);
        return getNextTutorialAchievement();
    }
    return null;
}

export const resetTutorial = () => {
    localStorage.removeItem('tutorialAchievements');
}

