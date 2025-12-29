import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
    analyser: AnalyserNode | null;
    color: string;
    isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, color, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !analyser) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Draw Frequency Bars
            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height;

                // Create gradient
                const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, '#ffffff');

                ctx.fillStyle = gradient;
                
                // Mirror effect
                ctx.fillRect(x, height / 2 - barHeight / 2, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        if (isPlaying) {
            draw();
        } else {
             // Clear if stopped
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             // Draw a flat line
             ctx.strokeStyle = color;
             ctx.beginPath();
             ctx.moveTo(0, canvas.height / 2);
             ctx.lineTo(canvas.width, canvas.height / 2);
             ctx.stroke();
        }

        return () => cancelAnimationFrame(animationId);
    }, [analyser, color, isPlaying]);

    return (
        <canvas 
            ref={canvasRef} 
            width={300} 
            height={80} 
            className="w-full h-full rounded bg-black/40 shadow-inner"
        />
    );
};
