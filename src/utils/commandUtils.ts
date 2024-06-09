export const commandTextToHTML = (text: string): string => {
  return text.replace(/\n/g, '<br/>');
};
