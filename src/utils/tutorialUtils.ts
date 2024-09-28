import { Tutorial, Tutorials } from "../types/Types";
const completedTutorialsKey = "completed-tutorials";
export const loadTutorials = (): string[] => {
    const storedAchievements = localStorage.getItem('completed-tutorials');
    return storedAchievements ? JSON.parse(storedAchievements) : [];
}

export const saveTutorials = (achievementPhrase: string) => {
    const storedAchievementString: string = localStorage.getItem(completedTutorialsKey) || '';
    const storedAchievements: string[] = storedAchievementString ? JSON.parse(storedAchievementString) : [];
    // Don't add duplicate tutorials
    if (storedAchievements.includes(achievementPhrase)) return;
    storedAchievements.push(achievementPhrase);
    localStorage.setItem(completedTutorialsKey, JSON.stringify(storedAchievements));
}

export const getNextTutorial = ():Tutorial | null => {
    const unlockedAchievements = loadTutorials() || [];
    const nextAchievement = Tutorials
        .find(a => !unlockedAchievements.some(ua => ua === a.phrase.join('')));
    return nextAchievement || null;
}

export const unlockTutorial = (command: string, achievement: string): Tutorial | null => {
    if (command === '') command = 'Return (ENTER)';
    if (achievement === command) {
        saveTutorials(command);
        return getNextTutorial();
    }
    return null;
}

export const resetTutorial = () => {
    localStorage.removeItem(completedTutorialsKey);
}

