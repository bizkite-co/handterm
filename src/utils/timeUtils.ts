export const createTimeCode = (now = new Date()): string[] => {
  return now.toISOString().split(':');
};
