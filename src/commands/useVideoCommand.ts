// useVideoCommand.ts
import { ICommandContext } from './CommandContext';

export const useVideoCommand = (context: ICommandContext) => {
  // context is now passed as an argument
  return (args: string[]): string => {
    if (!context.videoRef.current) {
      return 'Video element not available.';
    }
    // Logic to control the video element
    context.videoRef.current.toggleVideo();
    return 'Video command executed.' + args;

  };
};