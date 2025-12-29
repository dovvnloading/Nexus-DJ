import React from 'react';
import { Fader } from '../Fader';

interface PitchFaderProps {
    pitch: number;
    setPitch: (v: number) => void;
    color: string;
}

export const PitchFader: React.FC<PitchFaderProps> = ({ pitch, setPitch, color }) => {
    return (
        <div className="w-14 bg-black/40 rounded border border-white/5 relative">
            <div className="absolute inset-x-0 top-1 text-[8px] text-center text-gray-500 font-mono pointer-events-none">TEMPO</div>
            <div className="absolute inset-0 top-6 bottom-8 px-1">
                <Fader 
                    value={pitch} 
                    min={0.92} 
                    max={1.08} 
                    onChange={setPitch} 
                    label="" 
                    height="h-full"
                    color={color}
                    defaultValue={1}
                    tooltipTitle="PITCH"
                    tooltipDesc="Tempo adjust +/- 8%."
                />
            </div>
            <div className="absolute inset-x-0 bottom-1 text-[9px] text-center text-white font-mono bg-black/50 py-1 border-t border-white/10 mx-1 rounded-sm pointer-events-none">
                {pitch > 1 ? '+' : ''}{((pitch - 1) * 100).toFixed(1)}%
            </div>
        </div>
    );
};