import { ActivityType } from "./runtimeConstants.js";

export interface ParsedLocation {
  activityKey: ActivityType;
  contentKey: string | null;
  groupKey: string | null;
  clearParams: boolean;
}
