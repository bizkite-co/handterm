import { ActivityType } from "./runtimeConstants";

export interface ParsedLocation {
  activityKey: ActivityType;
  contentKey: string | null;
  groupKey: string | null;
  clearParams: boolean;
}
