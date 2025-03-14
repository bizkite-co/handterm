import { WebContainer } from '@webcontainer/api';

declare global {
  interface Window {
    webcontainerInstance: WebContainer | null;
  }
}

export {};