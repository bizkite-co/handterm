// src/signals/appSignals.ts
import { computed, signal } from '@preact/signals-react';
import { ActivityType, OutputElement } from 'src/types/Types';
import { createPersistentSignal } from 'src/utils/signalPersistence';

const currentOutputKey = 'current-output';
export const activitySignal = signal<ActivityType>(ActivityType.NORMAL);
export const notificationSignal = signal<string | null>(null)
export const isEditModeSignal = signal<boolean>(false);
export const isShowVideoSignal = signal<boolean>(false);

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
        const newOutput = [...prevOutput, element].slice(-3);
        return newOutput;
    });
};

export const setNotification = (notification: string) => {
    notificationSignal.value = notification;
}
