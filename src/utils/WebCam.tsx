import type React from 'react';
import { useRef, useEffect } from 'react';

export interface WebCamProps {
    setOn: boolean;
}

const WebCam: React.FC<WebCamProps> = ({ setOn }): JSX.Element => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.id = 'terminal-video';
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('webkit-playsinline', '');
        videoElement.setAttribute('x5-playsinline', '');

        if (setOn) {
            navigator.mediaDevices
                .getUserMedia({
                    video: {
                        facingMode: 'environment'
                    }
                })
                .then((stream: MediaStream) => {
                    if (videoElement) {
                        videoElement.srcObject = stream;
                    }
                })
                .catch((error: Error) => {
                    console.error('Error accessing media devices:', error);
                });
        } else {
            if (videoElement.srcObject) {
                const tracks = (videoElement.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
                videoElement.srcObject = null;
            }
        }

        videoElement.hidden = !setOn;

        return () => {
            if (videoElement && videoElement.srcObject) {
                const tracks = (videoElement.srcObject as MediaStream).getTracks();
                tracks.forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
                videoElement.srcObject = null;
            }
        };
    }, [setOn]);

    return (
      <video ref={videoRef} style={{ width: '100%', height: 'auto' }}>
        <track kind="captions" src="" label="No captions available" />
      </video>
    );
};

export default WebCam;
