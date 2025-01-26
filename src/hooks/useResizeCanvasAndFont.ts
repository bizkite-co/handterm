// useResizeCanvasAndFont.ts
import { useState, useCallback, type TouchEventHandler, useRef } from 'react';

export function useResizeCanvasAndFont(): {
    fontSize: number;
    canvasHeight: number;
    handleTouchMove: (event: TouchEvent) => void;
    handleTouchStart: TouchEventHandler<HTMLElement>;
    handleTouchEnd: TouchEventHandler<HTMLDivElement>;
} {
    const initialFontSize = parseInt(localStorage.getItem("fontSize") ?? '17');
    const initialCanvasHeight = parseInt(localStorage.getItem('canvas-height') ?? '100');
    const [fontSize, setFontSize] = useState(initialFontSize);
    const [canvasHeight, setCanvasHeight] = useState(initialCanvasHeight);
    const lastTouchDistanceRef = useRef<number | null>(null);

    const handleTouchMove = useCallback((event: TouchEvent) => {
        if (event.touches.length === 2) {
            event.preventDefault();

            const currentDistance =
                getDistanceBetweenTouches(event.touches);
            if (lastTouchDistanceRef.current && lastTouchDistanceRef.current > 0) {
                const eventTarget = event.target as HTMLElement;
                const scaleFactor = currentDistance /
                    lastTouchDistanceRef.current;
                if (eventTarget && eventTarget.nodeName ===
                    'CANVAS') {
                    setCanvasHeight(prevCanvasHeight => prevCanvasHeight * scaleFactor);
                } else {
                    setFontSize(prevFontSize => prevFontSize *
                        scaleFactor);
                    document.documentElement.style.setProperty('--rminal-font-size', `${fontSize}px`);
                }
                lastTouchDistanceRef.current = currentDistance;
            }
        }
    }, [fontSize]);

    const handleTouchStart: TouchEventHandler<HTMLElement> = (event: React.TouchEvent<HTMLElement>) => {
        setTimeout(() => {
            // this.terminalElement.focus();
        }, 500)
        if (event.touches.length === 2) {
            // event.preventDefault();
            lastTouchDistanceRef.current = getDistanceBetweenTouches(event.touches as unknown as TouchList);
        }
    }

    const handleTouchEnd: TouchEventHandler<HTMLDivElement> = () => {
        localStorage.setItem('terminalFontSize', `${fontSize}`);
        lastTouchDistanceRef.current = null;
    }

    const getDistanceBetweenTouches = (touches: TouchList): number => {
        const touch1 = touches[0];
        const touch2 = touches[1];
        return Math.sqrt(
            Math.pow((touch2?.pageX ?? 0) - (touch1?.pageX ?? 0), 2) +
            Math.pow((touch2?.pageY ?? 0) - (touch1?.pageY ?? 0), 2),
        );
    }

    // Return the state and handlers
    return {
        fontSize,
        canvasHeight,
        handleTouchMove,
        handleTouchStart,
        handleTouchEnd,
    };
}
