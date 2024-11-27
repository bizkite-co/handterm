import { signal } from "@preact/signals-react";

export const isTreeViewVisibleSignal = signal<boolean>(false);
export const selectedTreeItemSignal = signal<number>(-1);
export const treeItemsSignal = signal<Array<{path: string, type: string}>>([]);
