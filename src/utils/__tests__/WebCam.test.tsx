import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import WebCam from '../WebCam';

describe('WebCam component', () => {
  let mockTracks: { stop: ReturnType<typeof vi.fn>; enabled: boolean }[];
  let mockStream: { getTracks: ReturnType<typeof vi.fn> };
  let originalMediaDevices: MediaDevices | undefined;

  beforeEach(() => {
    mockTracks = [{ stop: vi.fn(), enabled: true }];
    mockStream = { getTracks: vi.fn(() => mockTracks) };

    originalMediaDevices = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('renders video element with id terminal-video and no inline height override', () => {
    const { container } = render(<WebCam setOn={false} />);
    const video = container.querySelector('video#terminal-video') as HTMLVideoElement;
    expect(video).toBeTruthy();
    expect(video.id).toBe('terminal-video');
    expect(video.style.height).toBe('');
  });

  it('requests environment camera stream when setOn is true', async () => {
    render(<WebCam setOn={true} />);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'environment' },
    });
  });

  it('stops media tracks on unmount when stream was active', async () => {
    const { unmount } = render(<WebCam setOn={true} />);
    // Allow promise resolution
    await Promise.resolve();
    unmount();
    expect(mockTracks[0].stop).toHaveBeenCalled();
  });
});
