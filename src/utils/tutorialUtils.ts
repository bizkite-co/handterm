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

export const unlockTutorial = (command: string, tutorial: Tutorial): boolean => {
    if (command === '') command = 'Return (ENTER)';
    if (tutorial.phrase.join('') === command) {
        saveTutorials(command);
        return true;
    }
    return false;
}

export const resetTutorial = () => {
    localStorage.removeItem(completedTutorialsKey);
}

