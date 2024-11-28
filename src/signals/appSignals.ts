// src/signals/appSignals.ts
import { computed, signal } from '@preact/signals-react';
import { ActivityType, OutputElement } from 'src/types/Types';
import { createPersistentSignal } from 'src/utils/signalPersistence';

const currentOutputKey = 'current-output';
export const activitySignal = signal<ActivityType>(ActivityType.NORMAL);
export const notificationSignal = signal<string | null>(null)
export const isEditModeSignal = signal<boolean>(false);
export const isShowVideoSignal = signal<boolean>(false);
export const bypassTutorialSignal = signal<boolean>(false);
export const isInLoginProcessSignal = signal<boolean>(false);
export const isInSignUpProcessSignal = signal<boolean>(false);
export const tempUserNameSignal = signal<string>('');
export const tempPasswordSignal = signal<string>('');
export const tempEmailSignal = signal<string>('');

export const setIsInSignUpProcess = (value: boolean) => {
    isInSignUpProcessSignal.value = value;
}
export const setTempEmail = (value: string) => {
    tempEmailSignal.value = value;
}

export const setIsInLoginProcess = (value: boolean) => {
    isInLoginProcessSignal.value = value;
};

export const setTempUserName = (value: string) => {
    tempUserNameSignal.value = value;
};

export const setTempPassword = (value: string) => {
    tempPasswordSignal.value = value;
};

export const setBypassTutorial = (value: boolean) => {
  bypassTutorialSignal.value = value;
};

const { signal: outputElementsSignal, update: updateOutput } = createPersistentSignal({
    key: currentOutputKey,
    signal: signal<OutputElement[]>([]),
    serialize: (value) => JSON.stringify(value),
    deserialize: (value) => JSON.parse(value)
});

export { outputElementsSignal };

export const isInGameModeSignal = computed(() => activitySignal.value === ActivityType.GAME);
export const isInTutorialModeSignal = computed(() => activitySignal.value === ActivityType.TUTORIAL);

export const setActivity = (activity: ActivityType) => {
    activitySignal.value = activity;
    console.log(ActivityType[activitySignal.value]);
};

export const appendToOutput = (element: OutputElement) => {
    updateOutput(prevOutput => {
        // If the command is sensitive, mask the args except the first one (username)
        if (element.sensitive && element.command) {
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

export const setNotification = (notification: string) => {
    notificationSignal.value = notification;
}

export const isLoggedInSignal = signal<boolean>(false);
export const userNameSignal = signal<string | null>(null);

export const setIsLoggedIn = (value: boolean) => {
  isLoggedInSignal.value = value;
};

export const setUserName = (name: string | null) => {
  userNameSignal.value = name;
};
