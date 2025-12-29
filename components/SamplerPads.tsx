import React, { useState, useEffect, useRef } from 'react';
import { DeckId } from '../types';
import { TooltipWrapper } from './TooltipWrapper';

interface SamplerPadsProps {
    audioContext: AudioContext | null;
    connectToMixer: (node: AudioNode, id: DeckId) => void;
    id: DeckId;
    color: string;
}

interface PadData {
    buffer: AudioBuffer | null;
    name: string;
}

export const SamplerPads: React.FC<SamplerPadsProps> = ({ audioContext, connectToMixer, id, color }) => {
    const [pads, setPads] = useState<PadData[]>([
        { buffer: null, name: 'Empty' },
        { buffer: null, name: 'Empty' },
        { buffer: null, name: 'Empty' },
        { buffer: null, name: 'Empty' }
    ]);
    const [activePad, setActivePad] = useState<number | null>(null);
    const [mode, setMode] = useState<'PLAY' | 'LOAD'>('PLAY');

    const masterGainRef = useRef<GainNode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const loadIndexRef = useRef<number>(0);

    // Initialize Audio Graph
    useEffect(() => {
        if (!audioContext || masterGainRef.current) return;
        
        masterGainRef.current = audioContext.createGain();
        masterGainRef.current.gain.value = 1.0;
        
        // Connect to mixer
        connectToMixer(masterGainRef.current, id);
    }, [audioContext, connectToMixer, id]);

    // Handle File Upload
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !audioContext) return;
        
        const file = e.target.files[0];
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            setPads(prev => {
                const newPads = [...prev];
                newPads[loadIndexRef.current] = {
                    buffer: audioBuffer,
                    name: file.name.substring(0, 8)
                };
                return newPads;
            });
            setMode('PLAY'); // Switch back to play after load
        } catch (err) {
            console.error("Error loading sample:", err);
        }
    };

    const triggerPad = async (index: number) => {
        if (!audioContext || !masterGainRef.current) return;

        if (mode === 'LOAD') {
            loadIndexRef.current = index;
            fileInputRef.current?.click();
            return;
        }

        // PLAY MODE
        const pad = pads[index];
        if (pad.buffer) {
            const source = audioContext.createBufferSource();
            source.buffer = pad.buffer;
            source.connect(masterGainRef.current);
            source.start();
            
            // Visual feedback
            setActivePad(index);
            setTimeout(() => setActivePad(null), 150);
        } else {
            // If empty in play mode, open load
            loadIndexRef.current = index;
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="w-full h-24 bg-black/40 rounded border border-white/5 flex flex-col p-1 gap-1 relative overflow-hidden shrink-0">
             {/* Mode Selector */}
             <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-[9px] font-mono text-gray-500 tracking-widest">SAMPLER</span>
                <div className="flex gap-1">
                    <TooltipWrapper title="PLAY MODE" desc="Trigger samples normally.">
                        <button 
                            onClick={() => setMode('PLAY')}
                            className={`text-[8px] px-2 py-0.5 rounded font-mono border ${mode === 'PLAY' ? 'bg-cyan-900/50 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
                        >
                            PLAY
                        </button>
                    </TooltipWrapper>
                    <TooltipWrapper title="LOAD MODE" desc="Click a pad to load a sample from file.">
                        <button 
                            onClick={() => setMode('LOAD')}
                            className={`text-[8px] px-2 py-0.5 rounded font-mono border ${mode === 'LOAD' ? 'bg-orange-900/50 border-orange-400 text-orange-200 shadow-[0_0_8px_rgba(251,146,60,0.4)]' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
                        >
                            LOAD
                        </button>
                    </TooltipWrapper>
                </div>
             </div>

             {/* Pads Grid */}
             <div className="flex-1 flex gap-1">
                {pads.map((pad, i) => (
                    <TooltipWrapper key={i} title={`SAMPLE PAD ${i+1}`} desc="Trigger one-shot sample.">
                        <button 
                            onMouseDown={() => triggerPad(i)}
                            className={`flex-1 rounded border relative overflow-hidden group transition-all active:scale-95 flex items-center justify-center flex-col
                            ${activePad === i ? `bg-[${color}] border-white shadow-[0_0_15px_${color}]` : 'bg-white/5 border-white/10 hover:bg-white/10'}
                            `}
                            style={activePad === i ? { backgroundColor: color, borderColor: '#fff' } : {}}
                        >
                            {/* Status Light */}
                            <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${pad.buffer ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-gray-800'}`}></div>
                            
                            <span className={`text-[9px] font-mono font-bold tracking-widest truncate max-w-full px-1 ${activePad === i ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                {pad.buffer ? pad.name : (mode === 'LOAD' ? 'LOAD' : 'EMPTY')}
                            </span>
                        </button>
                    </TooltipWrapper>
                ))}
             </div>

             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="audio/*"
            />
        </div>
    );
};