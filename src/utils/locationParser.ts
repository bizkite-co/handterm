import { Activity, ParsedLocation, VALID_ACTIVITIES } from "src/types/Types";

// utils/locationParser.ts
export function parseLocation(pathname: string): ParsedLocation {
  const [, activityRaw, id] = pathname.split('/');
  const activity = VALID_ACTIVITIES.includes(activityRaw as Activity) 
    ? activityRaw as Activity 
    : 'normal';
  return { activity, id: id || undefined };
}