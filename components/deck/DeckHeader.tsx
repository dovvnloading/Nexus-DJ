import React, { useRef } from 'react';
import { Visualizer } from '../Visualizer';
import { WaveformScrubber } from '../WaveformScrubber';
import { TooltipWrapper } from '../TooltipWrapper';
import { DeckId } from '../../types';

interface DeckHeaderProps {
    id: DeckId;
    color: string;
    fileName: string | null;
    audioBuffer: AudioBuffer | null;
    bpm: number;
    setBpm: (bpm: number) => void;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    analyserNode: AnalyserNode | null;
    loopState: { active: boolean, start: number, end: number };
    onSync: () => void;
    seek: (time: number) => void;
    loadFile: (file: File) => void;
}

export const DeckHeader: React.FC<DeckHeaderProps> = ({
    id, color, fileName, audioBuffer, bpm, setBpm, currentTime, duration, isPlaying, 
    analyserNode, loopState, onSync, seek, loadFile
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastTapRef = useRef<number>(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) loadFile(e.target.files[0]);
    };

    const handleTap = () => {
        const now = Date.now();
        const diff = now - lastTapRef.current;
        if (diff > 200 && diff < 3000) {
            const newBpm = Math.round(60000 / diff);
            setBpm(newBpm);
        }
        lastTapRef.current = now;
    };

    const handleBeatJump = (beats: number) => {
        if (duration === 0) return;
        const beatDuration = 60 / bpm;
        const jumpTime = beatDuration * beats;
        seek(currentTime + jumpTime);
    };

    const formatTime = (seconds: number) => {
        if (!Number.isFinite(seconds) || isNaN(seconds)) return "0:00.00";
        const absSeconds = Math.abs(seconds);
        const min = Math.floor(absSeconds / 60);
        const sec = Math.floor(absSeconds % 60);
        const ms = Math.floor((absSeconds % 1) * 100);
        return `${min}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-[#0a0a0c] p-4 rounded-lg border border-gray-800 relative overflow-hidden h-40 flex flex-col justify-between shadow-[inset_0_0_20px_rgba(0,0,0,1)] group">
            <div className="flex justify-between items-start z-40 pointer-events-none">
                <div>
                    <h2 className="text-4xl font-black font-[Rajdhani] italic tracking-tighter" style={{color: color, textShadow: `0 0 10px ${color}`}}>
                        DECK {id}
                    </h2>
                    <div className="text-xs text-gray-500 font-mono mt-1 truncate max-w-[200px]">
                        {fileName ? fileName : (audioBuffer ? 'TRACK LOADED' : 'NO DISC')}
                    </div>
                </div>
                
                <div className="pointer-events-auto flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 bg-gray-900/80 rounded p-1 border border-white/10 backdrop-blur-md">
                        <button onClick={() => setBpm(128)} className="text-[9px] px-1 hover:text-white text-gray-500 font-mono">128</button>
                        <button onClick={() => setBpm(140)} className="text-[9px] px-1 hover:text-white text-gray-500 font-mono">140</button>
                        <button onClick={() => setBpm(174)} className="text-[9px] px-1 hover:text-white text-gray-500 font-mono">174</button>
                        <div className="w-[1px] h-3 bg-gray-700 mx-1"></div>
                        <input 
                            type="number" 
                            value={bpm} 
                            onChange={(e) => setBpm(Number(e.target.value))}
                            className="w-10 bg-transparent text-right font-mono text-cyan-400 outline-none text-xs border-b border-gray-700 focus:border-cyan-500" 
                        />
                        <span className="text-[9px] text-gray-500 font-mono">BPM</span>
                    </div>
                    <div className="flex gap-1 items-center">
                            <TooltipWrapper title="SYNC" desc="Instantly matches BPM and phase aligns beats with the other deck.">
                            <button 
                                onClick={onSync}
                                className="text-[9px] bg-gray-900 hover:bg-gray-800 border border-gray-700 text-cyan-400 px-3 py-[1px] rounded font-mono active:bg-cyan-500 active:text-black transition-all shadow-[0_0_8px_rgba(34,211,238,0.2)] hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] font-bold tracking-widest"
                            >
                                SYNC
                            </button>
                            </TooltipWrapper>
                            <div className="w-[1px] h-3 bg-gray-700 mx-0.5"></div>
                            <TooltipWrapper title="TAP TEMPO" desc="Tap consistently to calculate BPM manually.">
                            <button 
                                onClick={handleTap}
                                className="text-[9px] bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-2 rounded font-mono active:bg-white active:text-black transition-colors"
                            >
                                TAP
                            </button>
                            </TooltipWrapper>
                            <TooltipWrapper title="BEAT JUMP BACK" desc="Instantly jump back 4 beats.">
                            <button onClick={() => handleBeatJump(-4)} className="text-[9px] bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-1 rounded font-mono active:scale-95">{'<4'}</button>
                            </TooltipWrapper>
                            <TooltipWrapper title="BEAT JUMP FWD" desc="Instantly jump forward 4 beats.">
                            <button onClick={() => handleBeatJump(4)} className="text-[9px] bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-1 rounded font-mono active:scale-95">{'4>'}</button>
                            </TooltipWrapper>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-5xl font-mono text-white tracking-widest leading-none drop-shadow-[0_0_5px_white]">
                        {formatTime(currentTime)}
                    </div>
                    <div className="text-sm text-gray-600 font-mono mt-1">
                        REMAIN {formatTime(duration - currentTime)}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-24 z-0 pointer-events-none">
                    <div className="absolute inset-0 opacity-40 mix-blend-screen">
                    <Visualizer analyser={analyserNode} color={color} isPlaying={isPlaying} />
                    </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-10 z-20">
                    <WaveformScrubber 
                    duration={duration} 
                    currentTime={currentTime} 
                    onSeek={seek} 
                    color={color}
                    loopStart={loopState.start}
                    loopEnd={loopState.end}
                    isLooping={loopState.active}
                    />
            </div>

            {!audioBuffer && (
                    <div 
                    className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm cursor-pointer hover:bg-black/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    >
                    <span className="text-xl font-bold font-mono tracking-[0.5em] text-white/50 border border-white/20 px-6 py-2 rounded animate-pulse">LOAD TRACK</span>
                    </div>
            )}
            <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
    );
};