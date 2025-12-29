import React, { useRef, useState, useEffect } from 'react';
import { TooltipWrapper } from '../TooltipWrapper';
import { DeckId } from '../../types';

interface PlatterSectionProps {
    id: DeckId;
    audioBuffer: AudioBuffer | null;
    isPlaying: boolean;
    isReversed: boolean;
    pitch: number;
    startScratch: () => void;
    scratchMovement: (velocity: number) => void;
    stopScratch: () => void;
}

export const PlatterSection: React.FC<PlatterSectionProps> = ({
    id, audioBuffer, isPlaying, isReversed, pitch,
    startScratch, scratchMovement, stopScratch
}) => {
    const platterRef = useRef<HTMLDivElement>(null);
    const lastAngleRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const rotationRef = useRef<number>(0);
    const [displayedRotation, setDisplayedRotation] = useState(0);
    const [isScratching, setIsScratching] = useState(false);

    const getAngle = (clientX: number, clientY: number) => {
        if (!platterRef.current) return 0;
        const rect = platterRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    };

    const handlePlatterStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!audioBuffer) return;
        e.preventDefault();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        setIsScratching(true);
        startScratch();
        
        lastAngleRef.current = getAngle(clientX, clientY);
        lastTimeRef.current = performance.now();
        
        if ('touches' in e) {
            window.addEventListener('touchmove', handlePlatterMove, { passive: false });
            window.addEventListener('touchend', handlePlatterEnd);
        } else {
            window.addEventListener('mousemove', handlePlatterMove);
            window.addEventListener('mouseup', handlePlatterEnd);
        }
    };

    const handlePlatterMove = (e: MouseEvent | TouchEvent) => {
        if (!audioBuffer) return;
        e.preventDefault();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        const now = performance.now();
        const angle = getAngle(clientX, clientY);
        
        let delta = angle - lastAngleRef.current;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        
        rotationRef.current += delta;
        
        const dt = now - lastTimeRef.current;
        if (dt > 0) {
            const velocity = (delta / dt) * 12;
            scratchMovement(velocity);
        }

        lastAngleRef.current = angle;
        lastTimeRef.current = now;
    };

    const handlePlatterEnd = () => {
        setIsScratching(false);
        stopScratch();
        window.removeEventListener('mousemove', handlePlatterMove);
        window.removeEventListener('mouseup', handlePlatterEnd);
        window.removeEventListener('touchmove', handlePlatterMove);
        window.removeEventListener('touchend', handlePlatterEnd);
    };

    useEffect(() => {
        let raf: number;
        const loop = () => {
            if (!isScratching) {
                if (isPlaying) {
                    const dir = isReversed ? -1 : 1;
                    rotationRef.current = (rotationRef.current + (pitch * 2.5 * dir)) % 360;
                }
            }
            setDisplayedRotation(rotationRef.current);
            raf = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(raf);
    }, [isPlaying, isScratching, pitch, isReversed]);

    return (
        <div className="flex-1 relative flex items-center justify-center p-4">
            <TooltipWrapper title="JOG WHEEL" desc="Touch top to scratch. Nudge side to pitch bend.">
                <div 
                    ref={platterRef}
                    className={`w-56 h-56 rounded-full border-[8px] border-[#1a1a1a] shadow-2xl relative flex items-center justify-center brushed-metal overflow-hidden touch-none ${audioBuffer ? 'cursor-grab active:cursor-grabbing' : 'opacity-50 cursor-not-allowed'}`}
                    style={{ transform: `rotate(${displayedRotation}deg)` }}
                    onMouseDown={handlePlatterStart}
                    onTouchStart={handlePlatterStart}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
                    <div className="absolute inset-2 rounded-full border border-black/50 bg-[repeating-radial-gradient(#111_0,#111_2px,#000_3px)] opacity-80"></div>
                    
                    <div className="w-20 h-20 rounded-full bg-black border border-gray-700 relative z-10 flex items-center justify-center shadow-lg pointer-events-none">
                        <div className={`w-16 h-16 rounded-full border border-white/20 opacity-50 ${id === DeckId.A ? 'bg-pink-500' : 'bg-blue-500'} blur-md`}></div>
                        <span className="absolute font-bold text-gray-200 text-xs tracking-widest z-20">NEX</span>
                    </div>

                    <div className="absolute top-0 w-4 h-12 bg-white/90 shadow-[0_0_10px_white] z-10 rounded-b pointer-events-none"></div>
                </div>
            </TooltipWrapper>
            
            <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 pointer-events-none ${id === DeckId.A ? 'bg-pink-600' : 'bg-blue-600'}`}></div>
        </div>
    );
};