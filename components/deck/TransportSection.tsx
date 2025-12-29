import React, { useState } from 'react';
import { TooltipWrapper } from '../TooltipWrapper';
import { DeckId } from '../../types';

interface TransportSectionProps {
    id: DeckId;
    bpm: number;
    isPlaying: boolean;
    hotCues: (number | null)[];
    loopState: { active: boolean, start: number, end: number };
    triggerHotCue: (index: number) => void;
    clearHotCue: (index: number, e: React.MouseEvent) => void;
    toggleLoop: (beats: number) => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
}

export const TransportSection: React.FC<TransportSectionProps> = ({
    id, bpm, isPlaying, hotCues, loopState,
    triggerHotCue, clearHotCue, toggleLoop, play, pause, stop
}) => {
    const [activeRollButton, setActiveRollButton] = useState<number | null>(null);

    const isLoopActive = (beats: number) => {
        if (!loopState.active) return false;
        const beatDuration = 60 / bpm;
        const currentLen = loopState.end - loopState.start;
        // Fix: Tighter tolerance to distinguish 1/8 from 1/4 at high BPMs
        // At 175 BPM, 1/8 = ~42ms, 1/4 = ~85ms. Diff = ~43ms.
        // Tolerance must be < 40ms. Using 10ms (0.01s).
        return Math.abs(currentLen - (beats * beatDuration)) < 0.01;
    };

    // --- ROLL (GLITCH) LOGIC ---
    // Left Click: Momentary (Hold to loop, Release to stop)
    // Right Click: Latch (Toggle)
    const handleRollMouseDown = (beats: number, e: React.MouseEvent) => {
        e.preventDefault(); 
        
        if (e.button === 2) {
             // Right Click -> Toggle
             if (isLoopActive(beats)) toggleLoop(0);
             else toggleLoop(beats);
        } else {
             // Left Click -> Momentary Start
             // Always trigger to allow stutter effects and grabbing of latched loops
             toggleLoop(beats);
             setActiveRollButton(beats);
        }
    };

    const handleRollMouseUp = (beats: number, e: React.MouseEvent) => {
        if (e.button === 0 && activeRollButton === beats) {
             toggleLoop(0);
             setActiveRollButton(null);
        }
    };
    
    const handleRollMouseLeave = (beats: number) => {
        if (activeRollButton === beats) {
            toggleLoop(0);
            setActiveRollButton(null);
        }
    };

    // --- PHRASE LOOP LOGIC ---
    // Simple Toggle
    const handlePhraseClick = (beats: number) => {
        if (isLoopActive(beats)) {
            toggleLoop(0); // De-trigger
        } else {
            toggleLoop(beats); // Enable
        }
    };

    return (
        <div className="w-24 flex flex-col gap-2 h-full">
            {/* Hot Cues */}
            <div className="grid grid-cols-2 gap-1 mb-1 shrink-0">
                {hotCues.map((cue, i) => (
                    <TooltipWrapper key={i} title={`HOT CUE ${i+1}`} desc="Set or jump to cue. Right-click clear.">
                        <button
                            onMouseDown={() => triggerHotCue(i)}
                            onContextMenu={(e) => clearHotCue(i, e)}
                            className={`h-8 rounded border text-[8px] font-bold font-mono transition-all active:scale-95 flex items-center justify-center relative overflow-hidden group
                                ${cue !== null 
                                    ? `bg-gray-800 border-${id===DeckId.A ? 'pink' : 'blue'}-500/50 text-white shadow-[0_0_5px_${id===DeckId.A ? '#ec4899' : '#3b82f6'}]` 
                                    : 'bg-black/40 border-white/5 text-gray-600 hover:border-white/20'
                                }`}
                        >
                            {cue !== null ? <span className="animate-pulse">CUE {i+1}</span> : (i+1)}
                            {cue !== null && <div className={`absolute bottom-0 left-0 h-[2px] w-full ${id===DeckId.A ? 'bg-pink-500' : 'bg-blue-500'}`}></div>}
                        </button>
                    </TooltipWrapper>
                ))}
            </div>

            {/* Loop Section Container */}
            <div className="flex-1 flex flex-col gap-2 min-h-0">
                
                {/* Glitch / Roll Section */}
                <div className="bg-black/20 rounded border border-white/5 p-1 flex flex-col gap-1 items-center shrink-0">
                    <div className="text-[8px] text-gray-500 tracking-widest font-bold">ROLL</div>
                    <div className="grid grid-cols-2 gap-1 w-full">
                        {[0.125, 0.25, 0.5, 1].map((beats) => (
                            <TooltipWrapper key={beats} title="GLITCH ROLL" desc="Hold for momentary loop. Right-click to latch.">
                                <button 
                                    className={`py-2 border rounded text-[9px] font-mono transition-all active:scale-95
                                        ${(activeRollButton === beats || isLoopActive(beats)) 
                                            ? 'bg-purple-600 border-purple-300 text-white shadow-[0_0_10px_#9333ea] animate-pulse' 
                                            : 'bg-gray-800/50 border-gray-700 text-purple-400 hover:bg-purple-900/30'
                                        }`}
                                    onMouseDown={(e) => handleRollMouseDown(beats, e)}
                                    onMouseUp={(e) => handleRollMouseUp(beats, e)}
                                    onMouseLeave={() => handleRollMouseLeave(beats)}
                                    onContextMenu={(e) => e.preventDefault()}
                                >
                                    1/{Math.round(1/beats)}
                                </button>
                            </TooltipWrapper>
                        ))}
                    </div>
                </div>

                {/* Phrase Loops Section */}
                <div className="bg-black/20 rounded border border-white/5 p-1 flex flex-col gap-1 items-center flex-1">
                    <div className="text-[8px] text-gray-500 tracking-widest font-bold">LOOP</div>
                    <div className="grid grid-cols-2 gap-1 w-full h-full">
                        {[4, 8, 16, 32].map((beats) => (
                            <TooltipWrapper key={beats} title="BEAT LOOP" desc={`Toggle ${beats} beat loop.`}>
                                <button 
                                    className={`border rounded text-[10px] font-bold font-mono transition-all active:scale-95
                                        ${isLoopActive(beats)
                                            ? 'bg-cyan-600 border-cyan-300 text-white shadow-[0_0_10px_#22d3ee]' 
                                            : 'bg-gray-800/50 border-gray-700 text-cyan-400 hover:bg-cyan-900/30'
                                        }`}
                                    onClick={() => handlePhraseClick(beats)}
                                >
                                    {beats}
                                </button>
                            </TooltipWrapper>
                        ))}
                    </div>
                </div>
            </div>

            {/* Transport Controls */}
            <div className="shrink-0 flex flex-col gap-2 pt-1">
                <TooltipWrapper title="PLAY / PAUSE" desc="Start or stop track playback.">
                    <button 
                        className={`h-16 w-full rounded flex items-center justify-center font-bold text-2xl tracking-widest border border-white/10 transition-all active:scale-95 active:brightness-125 ${isPlaying ? 'bg-green-900/20 text-green-400 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}
                        onClick={isPlaying ? pause : play}
                    >
                        {isPlaying ? '||' : '▶'}
                    </button>
                </TooltipWrapper>
                
                <TooltipWrapper title="CUE RESET" desc="Stop and return to cue point.">
                    <button 
                        className="h-12 w-full bg-gray-800/50 border border-orange-500/30 text-orange-500 rounded font-bold tracking-widest hover:bg-orange-900/20 hover:shadow-[0_0_10px_rgba(249,115,22,0.2)] active:scale-95 transition-all text-xs"
                        onClick={() => { stop(); }}
                    >
                        CUE
                    </button>
                </TooltipWrapper>
            </div>
        </div>
    );
};