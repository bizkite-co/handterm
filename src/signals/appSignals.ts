// src/signals/appSignals.ts
declare global {
  interface Window {
    setActivity: typeof setActivity;
    ActivityType: typeof ActivityType;
  }
}

import { computed, signal } from '@preact/signals-react';

import { ActivityType, type OutputElement } from 'src/types/Types';
import { createLogger, LogLevel } from 'src/utils/Logger';
import { createPersistentSignal } from 'src/utils/signalPersistence';

const logger = createLogger({
  prefix: 'AppSignals',
  level: LogLevel.DEBUG
});

const currentOutputKey = 'current-output';
export const activitySignal = signal<ActivityType>(ActivityType.NORMAL);
export const notificationSignal = signal<string | null>(null);
export const isEditModeSignal = signal<boolean>(false);
export const isShowVideoSignal = signal<boolean>(false);
export const isInLoginProcessSignal = signal<boolean>(false);
export const isInSignUpProcessSignal = signal<boolean>(false);
export const tempUserNameSignal = signal<string>('');
export const tempPasswordSignal = signal<string>('');
export const tempEmailSignal = signal<string>('');

export const setIsInSignUpProcess = (value: boolean): void => {
    isInSignUpProcessSignal.value = value;
};

export const setTempEmail = (value: string): void => {
    tempEmailSignal.value = value;
};

export const toggleVideo = (): boolean => {
    isShowVideoSignal.value = !isShowVideoSignal.value;
    return isShowVideoSignal.value;
};

export const setIsInLoginProcess = (value: boolean): void => {
    isInLoginProcessSignal.value = value;
};

export const setTempUserName = (value: string): void => {
    tempUserNameSignal.value = value;
};

export const setTempPassword = (value: string): void => {
    tempPasswordSignal.value = value;
};

// Create a persistent signal for bypassTutorial
export const {
    signal: bypassTutorialSignal,
    update: setBypassTutorial
} = createPersistentSignal<boolean>({
    key: 'bypassTutorialKey', // Unique key for localStorage
    signal: signal<boolean>(false),
    serialize: (value: boolean) => JSON.stringify(value),
    deserialize: (value: string) => JSON.parse(value) as boolean
});

const {
    signal: outputElementsSignal,
    update: updateOutput
} = createPersistentSignal<OutputElement[]>({
    key: currentOutputKey,
    signal: signal<OutputElement[]>([]),
    serialize: (value: OutputElement[]) => JSON.stringify(value),
    deserialize: (value: string) => JSON.parse(value) as OutputElement[]
});

export { outputElementsSignal };

export const isInGameModeSignal = computed(() => activitySignal.value === ActivityType.GAME);
export const isInTutorialModeSignal = computed(() => activitySignal.value === ActivityType.TUTORIAL);

import { navigate } from 'src/utils/navigationUtils';

export const setActivity = (activity: ActivityType): void => {
    activitySignal.value = activity;
    logger.debug(ActivityType[activitySignal.value]);
    navigate({
        activityKey: activity,
        contentKey: null,
        groupKey: null
    });
};

export const appendToOutput = (element: OutputElement): void => {
    updateOutput(prevOutput => {
        // If the command is sensitive, mask the args except the first one (username)
        if (element.sensitive != null && element.command != null) {
            const maskedCommand = {
                ...element.command,
                args: element.command.args.map((arg, index) =>
                    index === 0 ? arg : '*'.repeat(arg.length)
                )
            };
            element = { ...element, command: maskedCommand };
        }
        const newOutput = [...prevOutput, element].slice(-3);
        return newOutput;
    });
};

export const setNotification = (notification: string): void => {
    notificationSignal.value = notification;
};

export const isLoggedInSignal = signal<boolean>(false);
export const userNameSignal = signal<string | null>(null);

export const setIsLoggedIn = (value: boolean): void => {
    isLoggedInSignal.value = value;
};

export const setUserName = (name: string | null): void => {
    userNameSignal.value = name;
};

// Expose activity functions on window for testing
if (typeof window != 'undefined') {
    window.setActivity = setActivity;
    window.ActivityType = ActivityType;
}
