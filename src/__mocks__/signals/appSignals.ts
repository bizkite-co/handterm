import { signal } from '@preact/signals-react';

export const activitySignal = signal('NORMAL');
export const bypassTutorialSignal = signal(false);
export const isInLoginProcessSignal = signal(false);
export const tempUserNameSignal = signal('');
export const setNotification = jest.fn();
export const setBypassTutorial = jest.fn();
export const setIsInLoginProcess = jest.fn();
export const setTempUserName = jest.fn();
export const setActivity = jest.fn();
export const isInGameModeSignal = signal(false);
export const isInTutorialModeSignal = signal(false);
