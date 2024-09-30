// useResizeCanvasAndFont.ts                             
import { useState, useCallback, TouchEventHandler } from 'react';

export function useResizeCanvasAndFont(initialFontSize: number, initialCanvasHeight: number) {
    const [fontSize, setFontSize] = useState(initialFontSize);
    const [canvasHeight, setCanvasHeight] = useState(initialCanvasHeight);
    let lastTouchDistance: number | null = null;

    const handleTouchMove = useCallback((event: TouchEvent) => {
        if (event.touches.length === 2) {
            event.preventDefault();

            const currentDistance =
                getDistanceBetweenTouches(event.touches);
            if (lastTouchDistance && lastTouchDistance > 0) {
                const eventTarget = event.target as HTMLElement;
                const scaleFactor = currentDistance /
                    lastTouchDistance;
                if (eventTarget && eventTarget.nodeName ===
                    'CANVAS') {
                    setCanvasHeight(prevCanvasHeight => prevCanvasHeight * scaleFactor);
                } else {
                    setFontSize(prevFontSize => prevFontSize *
                        scaleFactor);
                    document.documentElement.style.setProperty('--rminal-font-size', `${fontSize}px`);
                }
                lastTouchDistance = currentDistance;
            }
        }
    }, [fontSize]);


    const handleTouchStart: TouchEventHandler<HTMLElement> = (event: React.TouchEvent<HTMLElement>) => {
        setTimeout(() => {
            // this.terminalElement.focus();
        }, 500)
        if (event.touches.length === 2) {
            // event.preventDefault();
            lastTouchDistance = getDistanceBetweenTouches(event.touches as unknown as TouchList);
        }
    }

    const increaseFontSize = () => {
        setFontSize(prevFontSize => prevFontSize + 1);
        // this.terminal.options.fontSize = this.currentFontSize;
        // this.terminal.refresh(0, this.terminal.rows - 1);
        localStorage.setItem('terminalFontSize', `${fontSize}`);
        console.log('INCREASE terminalFontSize', fontSize);
    }

    const handleTouchEnd: TouchEventHandler<HTMLDivElement> = () => {
        localStorage.setItem('terminalFontSize', `${fontSize}`);
        console.log('SET terminalFontSize', fontSize);
        lastTouchDistance = null;
    }

    const addTouchListeners = () => {
        // Assuming 'terminalElementRef' points to the div you want to attach the event
        // const output = window.document.getElementById(TerminalCssClasses.Output);
        // if (output) {
        //   output.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        // }
        // const terminal = document.getElementById(TerminalCssClasses.Terminal);
        // if (terminal) {
        //   terminal.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        // }
        // const game = window.document.getElementById(TerminalCssClasses.TerminalGame);
        // if (game) {
        //   // game.addEventListener('touchstart', this.handleTouchStart );
        //   game.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        // }
    }

    const removeTouchListeners = () => {
        // const div = this.terminalElementRef.current;
        // if (div) {
        //   div.removeEventListener('touchmove', this.handleTouchMove);
        // }
        // const output = window.document.getElementById(TerminalCssClasses.Output);
        // if (output) {
        //   output.removeEventListener('touchmove', this.handleTouchMove);
        // }
        // const terminal = document.getElementById(TerminalCssClasses.Terminal);
        // if (terminal) {
        //   terminal.removeEventListener('touchmove', this.handleTouchMove);
        // }
        // const game = window.document.getElementById(TerminalCssClasses.TerminalGame);
        // if (game) {
        //   game.removeEventListener('touchmove', this.handleTouchMove);
        // }
    }

    const getDistanceBetweenTouches = (touches: TouchList): number => {
        const touch1 = touches[0];
        const touch2 = touches[1];
        return Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2),
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
