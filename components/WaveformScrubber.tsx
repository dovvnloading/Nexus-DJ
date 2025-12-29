import React, { useRef, useState } from 'react';

interface WaveformScrubberProps {
    duration: number;
    currentTime: number;
    onSeek: (time: number) => void;
    color: string;
    loopStart?: number;
    loopEnd?: number;
    isLooping?: boolean;
}

export const WaveformScrubber: React.FC<WaveformScrubberProps> = ({
    duration, currentTime, onSeek, color, loopStart = 0, loopEnd = 0, isLooping = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Calculate percent for the visual playhead
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    // Calculate loop visual styles
    const loopStartPercent = duration > 0 ? (loopStart / duration) * 100 : 0;
    const loopWidthPercent = duration > 0 ? ((loopEnd - loopStart) / duration) * 100 : 0;

    const getTimeFromEvent = (clientX: number) => {
        if (!containerRef.current || duration <= 0) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
        return percentage * duration;
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault(); // Prevent text selection/scrolling
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        const newTime = getTimeFromEvent(e.clientX);
        onSeek(newTime);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const newTime = getTimeFromEvent(e.clientX);
        onSeek(newTime);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isDragging) {
             setIsDragging(false);
             e.currentTarget.releasePointerCapture(e.pointerId);
             const newTime = getTimeFromEvent(e.clientX);
             onSeek(newTime);
        }
    };

    return (
        <div 
            ref={containerRef}
            className="absolute bottom-0 left-0 w-full h-full cursor-crosshair group z-20 border-t border-white/5 bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-[1px] touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* Background Track Line */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 group-hover:bg-white/20 transition-colors"></div>

            {/* Loop Region */}
            {isLooping && loopWidthPercent > 0 && (
                <div 
                    className="absolute top-0 h-full bg-green-500/10 border-l border-r border-green-500/50 pointer-events-none"
                    style={{ left: `${loopStartPercent}%`, width: `${loopWidthPercent}%` }}
                >
                    <div className="absolute top-0 left-0 text-[8px] bg-green-900 text-green-300 px-1 opacity-70">LOOP</div>
                </div>
            )}

            {/* Playhead - REMOVED transition-all for instant 1:1 cursor tracking */}
            <div 
                className="absolute top-0 h-full w-[2px] bg-white shadow-[0_0_10px_white] pointer-events-none"
                style={{ left: `${progressPercent}%` }}
            >
                <div className="absolute top-0 -translate-x-1/2 -translate-y-full">
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white"></div>
                </div>
            </div>

            {/* Progress Fill (Subtle) - REMOVED transition-all */}
            <div 
                className="absolute top-1/2 left-0 h-[2px] opacity-50 pointer-events-none"
                style={{ width: `${progressPercent}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            ></div>
            
            {/* Interactive Overlay Hover Effect */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none"></div>
        </div>
    );
};