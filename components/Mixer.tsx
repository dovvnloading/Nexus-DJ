import React, { useState, useRef } from 'react';
import { Fader } from './Fader';
import { Knob } from './Knob';
import { UserDocModal } from './UserDocModal';
import { TooltipWrapper } from './TooltipWrapper';
import { DeckId } from '../types';

interface MixerProps {
    crossfader: number;
    setCrossfader: (val: number) => void;
    volA: number;
    setVolA: (val: number) => void;
    volB: number;
    setVolB: (val: number) => void;
    setReverbA: (val: number) => void;
    setReverbB: (val: number) => void;
    // New FX Props
    reverbTime: number;
    setReverbTime: (val: number) => void;
    reverbSize: number;
    setReverbSize: (val: number) => void;
    onLoadTrack?: (id: DeckId, file: File) => void;
}

export const Mixer: React.FC<MixerProps> = ({ 
    crossfader, setCrossfader, volA, setVolA, volB, setVolB,
    setReverbA, setReverbB,
    reverbTime, setReverbTime, reverbSize, setReverbSize,
    onLoadTrack
}) => {
    const [showDocs, setShowDocs] = useState(false);
    const [curveSharp, setCurveSharp] = useState(false);
    
    // State for local UI
    const [revA, updateRevA] = useState(0);
    const [revB, updateRevB] = useState(0);

    // Library State
    const [libraryFiles, setLibraryFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files) as File[];
            // Filter for audio types roughly
            const audioFiles = files.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i));
            setLibraryFiles(prev => [...prev, ...audioFiles]);
        }
    };

    return (
        <div className="w-96 flex flex-col gap-2 h-full z-10 mx-4 relative transition-all duration-300">
            <div className="flex-1 glass-panel rounded-xl p-2 flex flex-col relative overflow-hidden bg-[#0c0c0e] shadow-2xl">
                
                {/* 1. Header Area */}
                <div className="w-full text-center border-b border-gray-800 pb-2 mb-2 relative shrink-0">
                    <div className="absolute right-0 top-0 flex gap-1 z-50">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDocs(true);
                            }}
                            className="w-5 h-5 rounded border border-gray-700 bg-gray-900/50 text-gray-500 hover:text-white hover:border-white hover:bg-white/10 flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer active:scale-95"
                            title="User Manual"
                        >
                            ?
                        </button>
                    </div>
                    <h1 className="text-3xl font-black font-[Rajdhani] italic tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] select-none">
                        NEXUS-DJ
                    </h1>
                </div>

                {/* 2. Track Library (The "Red Area") */}
                <div className="w-full h-40 bg-black/40 border border-white/10 rounded mb-2 flex flex-col shrink-0 relative overflow-hidden group">
                    <div className="h-6 bg-gray-900/80 border-b border-white/5 flex items-center justify-between px-2 shrink-0">
                        <span className="text-[9px] font-mono text-cyan-500 tracking-widest font-bold">TRACK LIBRARY</span>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[9px] bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 hover:bg-cyan-500 hover:text-black transition-colors"
                        >
                            + IMPORT FOLDER
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent p-1">
                        {libraryFiles.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 text-[10px] font-mono">
                                <span>NO TRACKS LOADED</span>
                                <span className="text-[8px] opacity-50 mt-1">SELECT A FOLDER OR FILES</span>
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-[1px]">
                                {libraryFiles.map((file, idx) => (
                                    <li key={idx} className="group/item flex items-center justify-between bg-white/5 hover:bg-white/10 p-1 rounded transition-colors text-[10px] font-mono">
                                        <span className="truncate text-gray-300 max-w-[140px]" title={file.name}>{file.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => onLoadTrack?.(DeckId.A, file)}
                                                className="px-1.5 bg-pink-900/50 text-pink-300 border border-pink-500/30 rounded hover:bg-pink-500 hover:text-white"
                                            >
                                                A
                                            </button>
                                            <button 
                                                onClick={() => onLoadTrack?.(DeckId.B, file)}
                                                className="px-1.5 bg-blue-900/50 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-500 hover:text-white"
                                            >
                                                B
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* Hidden Input supports directory selection via webkitdirectory attribute (React needs explicit cast or ignore TS error for non-standard attr) */}
                    <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        // @ts-ignore
                        webkitdirectory="" 
                    />
                </div>

                {/* 3. Main Mixer Controls (Compact Layout) */}
                <div className="flex-1 w-full flex justify-between px-1 items-stretch gap-1 min-h-0">
                     
                     {/* Channel A Strip */}
                     <div className="flex flex-col items-center justify-end gap-1 flex-1 min-w-[40px] h-full">
                         {/* VU Meter A */}
                         <div className="w-4 h-24 bg-black border border-gray-800 rounded-sm flex flex-col justify-end p-[1px] gap-[1px] shadow-inner mb-1 shrink-0">
                             {[...Array(15)].map((_, i) => (
                                 <div 
                                    key={i} 
                                    className={`w-full h-[6%] rounded-[1px] ${i > 11 ? 'bg-red-600' : (i > 7 ? 'bg-yellow-500' : 'bg-pink-600')}`}
                                    style={{ opacity: (15-i)/15 <= volA ? 1 : 0.15 }}
                                 ></div>
                             ))}
                         </div>
                         <div className="w-full flex-1 flex justify-center pb-1 min-h-0">
                            <Fader 
                                value={volA} min={0} max={1} onChange={setVolA} label="A" color="#ec4899" height="h-full" defaultValue={1} 
                                tooltipTitle="VOL A" tooltipDesc="Deck A Level."
                            />
                         </div>
                     </div>

                     {/* Center FX + Sends (Compressed) */}
                     <div className="flex flex-col justify-end items-center gap-1 w-32 bg-black/20 rounded border border-white/5 overflow-hidden pb-1 h-full">
                        
                        {/* Reverb Controls (2x2 Grid) */}
                        <div className="w-full p-2 grid grid-cols-2 gap-x-2 gap-y-1">
                             <Knob 
                                label="TIME" 
                                min={0.1} max={6} 
                                value={reverbTime} 
                                onChange={setReverbTime} 
                                color="#d946ef" 
                                size="xs" 
                                defaultValue={2.5}
                                tooltipTitle="REV TIME"
                            />
                             <Knob 
                                label="SIZE" 
                                min={0} max={1} 
                                value={reverbSize} 
                                onChange={setReverbSize} 
                                color="#8b5cf6" 
                                size="xs" 
                                defaultValue={0.5}
                                tooltipTitle="ROOM SIZE"
                            />
                             <Knob 
                                label="SND A" 
                                min={0} max={1} 
                                value={revA} 
                                onChange={(v) => { updateRevA(v); setReverbA(v); }} 
                                color="#ec4899" 
                                size="xs" 
                                defaultValue={0}
                                tooltipTitle="SEND A"
                                doubleClickToReset={true}
                            />
                             <Knob 
                                label="SND B" 
                                min={0} max={1} 
                                value={revB} 
                                onChange={(v) => { updateRevB(v); setReverbB(v); }} 
                                color="#3b82f6" 
                                size="xs" 
                                defaultValue={0}
                                tooltipTitle="SEND B"
                                doubleClickToReset={true}
                            />
                        </div>

                        {/* Spacer / Deco */}
                        <div className="flex-1 flex items-center justify-center opacity-10">
                             <div className="w-8 h-8 rounded-full border border-white animate-pulse"></div>
                        </div>

                        <div className="w-full text-center text-[8px] text-gray-600 font-mono">DSP REVERB</div>
                     </div>

                     {/* Channel B Strip */}
                     <div className="flex flex-col items-center justify-end gap-1 flex-1 min-w-[40px] h-full">
                         {/* VU Meter B */}
                         <div className="w-4 h-24 bg-black border border-gray-800 rounded-sm flex flex-col justify-end p-[1px] gap-[1px] shadow-inner mb-1 shrink-0">
                             {[...Array(15)].map((_, i) => (
                                 <div 
                                    key={i} 
                                    className={`w-full h-[6%] rounded-[1px] ${i > 11 ? 'bg-red-600' : (i > 7 ? 'bg-yellow-500' : 'bg-blue-600')}`}
                                    style={{ opacity: (15-i)/15 <= volB ? 1 : 0.15 }}
                                 ></div>
                             ))}
                         </div>
                         <div className="w-full flex-1 flex justify-center pb-1 min-h-0">
                            <Fader 
                                value={volB} min={0} max={1} onChange={setVolB} label="B" color="#3b82f6" height="h-full" defaultValue={1} 
                                tooltipTitle="VOL B" tooltipDesc="Deck B Level."
                            />
                         </div>
                     </div>
                </div>

                {/* 4. Crossfader Section */}
                <div className="w-full pt-2 border-t border-gray-800 bg-[#08080a] p-2 rounded-b-lg relative shrink-0">
                    <Fader 
                        value={crossfader} 
                        min={-1} 
                        max={1} 
                        onChange={setCrossfader} 
                        orientation="horizontal" 
                        color="#ffffff"
                        className="w-full h-8"
                        showTicks={false}
                        defaultValue={0}
                        tooltipTitle="X-FADER" tooltipDesc="Crossfader."
                    />
                    <div className="flex justify-between items-center text-[8px] text-gray-500 mt-1 font-mono tracking-widest px-2">
                        <span>A</span>
                        <TooltipWrapper title="CURVE" desc="Toggle Fade Curve.">
                            <div className="cursor-pointer hover:text-cyan-400" onClick={() => setCurveSharp(!curveSharp)}>
                                {curveSharp ? 'SHARP' : 'SOFT'}
                            </div>
                        </TooltipWrapper>
                        <span>B</span>
                    </div>
                </div>
            </div>
            
            {/* User Documentation Modal */}
            <UserDocModal isOpen={showDocs} onClose={() => setShowDocs(false)} />
        </div>
    );
};