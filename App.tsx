import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Deck } from './components/Deck';
import { Mixer } from './components/Mixer';
import { DeckId, DeckControls } from './types';
import { useReverb } from './hooks/useReverb';
import { TooltipProvider } from './context/TooltipContext';

function App() {
    const [started, setStarted] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const [crossfader, setCrossfader] = useState(0); // -1 to 1
    const [volA, setVolA] = useState(1);
    const [volB, setVolB] = useState(1);

    // Deck Registry for Sync Engine
    const deckRegistry = useRef<Record<string, DeckControls>>({});

    // Gain nodes for the mixer stage (Post-deck, Pre-Master)
    const mixNodeARef = useRef<GainNode | null>(null);
    const mixNodeBRef = useRef<GainNode | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);

    // Reverb Hook
    const { 
        inputNode: reverbInputNode, 
        outputNode: reverbOutputNode, 
        time: reverbTime, 
        setTime: setReverbTime, 
        size: reverbSize, 
        setSize: setReverbSize 
    } = useReverb(audioContextRef.current);

    const reverbSendARef = useRef<GainNode | null>(null);
    const reverbSendBRef = useRef<GainNode | null>(null);

    const initAudio = () => {
        if (started) return;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        // Create Master Channel
        masterGainRef.current = ctx.createGain();
        masterGainRef.current.connect(ctx.destination);

        // Create Sends
        reverbSendARef.current = ctx.createGain();
        reverbSendBRef.current = ctx.createGain();
        reverbSendARef.current.gain.value = 0;
        reverbSendBRef.current.gain.value = 0;

        // Create Channel Mix Nodes
        mixNodeARef.current = ctx.createGain();
        mixNodeBRef.current = ctx.createGain();

        mixNodeARef.current.connect(masterGainRef.current);
        mixNodeBRef.current.connect(masterGainRef.current);

        setStarted(true);
    };

    // Connect Reverb Output to Master when available
    useEffect(() => {
        if (!masterGainRef.current || !reverbOutputNode) return;
        reverbOutputNode.connect(masterGainRef.current);
    }, [reverbOutputNode]);

    // Connect Reverb Sends to Reverb Input when available
    useEffect(() => {
        if (!reverbInputNode || !reverbSendARef.current || !reverbSendBRef.current) return;
        
        reverbSendARef.current.connect(reverbInputNode);
        reverbSendBRef.current.connect(reverbInputNode);
    }, [reverbInputNode]);

    // Optimize connection function
    const connectDeck = useCallback((deckNode: AudioNode, id: DeckId) => {
        if (!mixNodeARef.current || !mixNodeBRef.current || !reverbSendARef.current || !reverbSendBRef.current) return;
        
        if (id === DeckId.A) {
            try {
                deckNode.disconnect(mixNodeARef.current);
                deckNode.disconnect(reverbSendARef.current);
            } catch(e) { /* ignore if not connected */ }
            
            deckNode.connect(mixNodeARef.current);
            deckNode.connect(reverbSendARef.current);
        } else {
            try {
                deckNode.disconnect(mixNodeBRef.current);
                deckNode.disconnect(reverbSendBRef.current);
            } catch(e) { /* ignore */ }

            deckNode.connect(mixNodeBRef.current);
            deckNode.connect(reverbSendBRef.current);
        }
    }, []);

    const setReverbSend = (id: DeckId, val: number) => {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        const target = id === DeckId.A ? reverbSendARef.current : reverbSendBRef.current;
        if (target) {
            target.gain.setTargetAtTime(val, ctx.currentTime, 0.1);
        }
    }

    // --- SYNC ENGINE (SOTA ALGORITHM) ---
    const registerDeck = useCallback((id: DeckId, controls: DeckControls) => {
        deckRegistry.current[id] = controls;
    }, []);

    const handleSync = useCallback((sourceId: DeckId) => {
        const targetId = sourceId === DeckId.A ? DeckId.B : DeckId.A;
        const sourceDeck = deckRegistry.current[sourceId];
        const targetDeck = deckRegistry.current[targetId];

        if (!sourceDeck || !targetDeck) return;

        const srcState = sourceDeck.getSyncState();
        const tgtState = targetDeck.getSyncState();

        // 1. Calculate Target Effective BPM
        // Effective BPM = Base BPM * Pitch Multiplier
        const targetEffectiveBpm = tgtState.bpm * tgtState.pitch;

        // 2. Calculate New Pitch for Source to match Target BPM
        // New Pitch = Target BPM / Source Base BPM
        const newPitch = targetEffectiveBpm / srcState.bpm;

        // 3. Phase Alignment (SOTA Beat Sync)
        // Beat Duration in seconds
        const beatDuration = 60 / targetEffectiveBpm;

        // Current phase within the beat (0 to beatDuration)
        const tgtPhase = tgtState.currentTime % beatDuration;
        const srcPhase = srcState.currentTime % beatDuration;

        // Calculate shortest distance to align phase
        let phaseDiff = tgtPhase - srcPhase;

        // Wrap logic: If diff is > half beat, go the other way for shortest jump
        if (phaseDiff > beatDuration / 2) {
            phaseDiff -= beatDuration;
        } else if (phaseDiff < -beatDuration / 2) {
            phaseDiff += beatDuration;
        }

        // Apply
        sourceDeck.applySync(newPitch, phaseDiff);

    }, []);

    const loadTrackToDeck = useCallback((id: DeckId, file: File) => {
        if (deckRegistry.current[id]) {
            deckRegistry.current[id].loadTrack(file);
        }
    }, []);

    // Update Mixer Logic (Crossfader curve)
    useEffect(() => {
        if (!mixNodeARef.current || !mixNodeBRef.current || !audioContextRef.current) return;
        
        const t = audioContextRef.current.currentTime;
        
        // Equal Power Crossfade Curve
        const x = 0.5 * (crossfader + 1);
        const gainA = Math.cos(x * 0.5 * Math.PI) * volA;
        const gainB = Math.cos((1 - x) * 0.5 * Math.PI) * volB;

        mixNodeARef.current.gain.setTargetAtTime(gainA, t, 0.05);
        mixNodeBRef.current.gain.setTargetAtTime(gainB, t, 0.05);

    }, [crossfader, volA, volB, started]);


    if (!started) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=10')] opacity-20 bg-cover bg-center"></div>
                <div className="z-10 text-center space-y-8">
                     <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 animate-pulse font-[Rajdhani] tracking-tighter filter drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">
                        NEXUS-DJ
                    </h1>
                    <p className="text-gray-400 tracking-[0.5em] text-lg font-mono">PROFESSIONAL CONTROLLER INTERFACE</p>
                    <button 
                        onClick={initAudio}
                        className="px-12 py-4 bg-gray-900 border border-gray-600 text-white font-bold tracking-widest hover:bg-gray-800 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300 rounded-sm"
                    >
                        INITIALIZE SYSTEM
                    </button>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="h-screen w-screen bg-[#050505] text-white p-4 flex flex-col relative overflow-hidden">
                {/* Background Ambience */}
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-radial from-purple-900/10 via-transparent to-transparent pointer-events-none"></div>
                
                <div className="flex-1 flex gap-2 max-w-[1600px] mx-auto w-full h-full items-stretch pb-2">
                    {/* Deck A */}
                    <div className="flex-1 min-w-[300px]">
                        <Deck 
                            id={DeckId.A} 
                            audioContext={audioContextRef.current} 
                            connectToMixer={connectDeck}
                            registerDeck={registerDeck}
                            onSync={() => handleSync(DeckId.A)}
                        />
                    </div>

                    {/* Mixer */}
                    <Mixer 
                        crossfader={crossfader} 
                        setCrossfader={setCrossfader}
                        volA={volA}
                        setVolA={setVolA}
                        volB={volB}
                        setVolB={setVolB}
                        setReverbA={(v) => setReverbSend(DeckId.A, v)}
                        setReverbB={(v) => setReverbSend(DeckId.B, v)}
                        // Pass Reverb Params
                        reverbTime={reverbTime}
                        setReverbTime={setReverbTime}
                        reverbSize={reverbSize}
                        setReverbSize={setReverbSize}
                        onLoadTrack={loadTrackToDeck}
                    />

                    {/* Deck B */}
                    <div className="flex-1 min-w-[300px]">
                        <Deck 
                            id={DeckId.B} 
                            audioContext={audioContextRef.current} 
                            connectToMixer={connectDeck}
                            registerDeck={registerDeck}
                            onSync={() => handleSync(DeckId.B)}
                        />
                    </div>
                </div>

                {/* Footer Status */}
                <div className="h-6 flex justify-between items-center text-[10px] text-gray-600 font-mono px-4 border-t border-gray-900">
                    <span>SYSTEM: ONLINE</span>
                    <span>AUDIO ENGINE: WEB_AUDIO_API_V1</span>
                    <span>DSP: ACTIVE // REVERB UNIT READY</span>
                </div>
            </div>
        </TooltipProvider>
    );
}

export default App;