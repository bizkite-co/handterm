// TerminalGame.ts
import React from 'react';

interface ITerminalGameProps {
    canvasHeight: string
}

interface ITerminalGameState {

}

export class TerminalGame extends React.Component<ITerminalGameProps, ITerminalGameState> {
    private canvasRef = React.createRef<HTMLCanvasElement>();

    drawGraphics = () => {
        const canvas = this.canvasRef?.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Clear the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Set properties for the rectangle
                ctx.fillStyle = 'blue';
                ctx.fillRect(10, 5, canvas.width - 20, 80); // Draw a blue rectangle

                // Set properties for the text
                ctx.fillStyle = 'white';
                ctx.font = '20px Arial';
                ctx.fillText('Type faster!', 20, 50); // Draw text
            }
        }
    }

    componentDidMount() {
        this.drawGraphics();
    }
    // Additional methods for calculating WPM, updating the progress bar, etc.
    render() {

        return (
            <canvas
                ref={this.canvasRef}
                height={this.props.canvasHeight}
                style={{ width: '100%', height: this.props.canvasHeight }}
            />
        );
    }
}