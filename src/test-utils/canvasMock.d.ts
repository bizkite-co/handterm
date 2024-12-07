import { Mock } from 'vitest';

export interface MockCanvasContext {
  fillRect: Mock;
  clearRect: Mock;
  drawImage: Mock;
  beginPath: Mock;
  closePath: Mock;
  stroke: Mock;
  fill: Mock;
}

export interface CanvasMock {
  mockGetContext: Mock;
  restoreOriginalGetContext: () => void;
}

export function createMockCanvasContext(): MockCanvasContext;
export function setupCanvasMock(): CanvasMock;
