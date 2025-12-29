import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioDeck } from '../hooks/useAudioDeck';
import { SamplerPads } from './SamplerPads';
import { COLORS, GATE_PRESETS } from '../constants';
import { DeckId, DeckControls } from '../types';

// Sub Components
import { DeckHeader } from './deck/DeckHeader';
import { TransportSection } from './deck/TransportSection';
import { FxSection } from './deck/FxSection';
import { PlatterSection } from './deck/PlatterSection';
import { MixerStrip } from './deck/MixerStrip';
import { PitchFader } from './deck/PitchFader';

interface DeckProps {
    id: DeckId;
    audioContext: AudioContext | null;
    connectToMixer: (node: AudioNode, id: DeckId) => void;
    registerDeck?: (id: DeckId, controls: DeckControls) => void;
    onSync?: () => void;
}

export const Deck: React.FC<DeckProps> = ({ id, audioContext, connectToMixer, registerDeck, onSync }) => {
    const { 
        loadFile, play, pause, stop, tapeStop, seek,
        setPitch, setGain, setPan,
        setOneKnobFilter, setEq, setDistortion, setDelay,
        setNoise, setFlange,
        toggleLoop, startScratch, scratchMovement, stopScratch,
        bpm, setBpm,
        gatePattern, setGatePattern, gateMix, setGateMix, gateRate, setGateRate,
        hotCues, triggerHotCue, clearHotCue, isReversed,
        audioBuffer, isPlaying, currentTime, duration, analyserNode, outputNode, loopState,
        fileName
    } = useAudioDeck(audioContext);

    // Stable Ref for Playback Control
    const controlsRef = useRef({ isPlaying, play, pause, tapeStop, seek });
    useEffect(() => { controlsRef.current = { isPlaying, play, pause, tapeStop, seek }; }, [isPlaying, play, pause, tapeStop, seek]);

    // State
    const [pitch, updatePitch] = useState(1);
    const [gain, updateGain] = useState(1);
    const [filterVal, updateFilterVal] = useState(0.5); // Center = Off
    const [panVal, updatePanVal] = useState(0); // Center = 0
    const [eqHi, updateEqHi] = useState(0);
    const [eqMid, updateEqMid] = useState(0);
    const [eqLow, updateEqLow] = useState(0);
    
    // FX State
    const [fxDist, setFxDist] = useState(0);
    const [fxDelayAmt, setFxDelayAmt] = useState(0);
    const [fxDelayTime, setFxDelayTime] = useState(0.33);

    // Channel FX State
    const [fxNoise, setFxNoise] = useState(0);
    const [fxFlange, setFxFlange] = useState(0);

    // Gate UI State
    const [gatePresetName, setGatePresetName] = useState('CUSTOM');

    const color = id === DeckId.A ? COLORS.deckA : COLORS.deckB;
    const neonBorder = id === DeckId.A ? 'neon-border-pink' : 'neon-border-blue';

    // --- SYNC REGISTRATION ---
    const syncStateGetterRef = useRef(() => ({ bpm, pitch, currentTime, isPlaying, duration }));
    useEffect(() => {
        syncStateGetterRef.current = () => ({ bpm, pitch, currentTime, isPlaying, duration });
    });

    useEffect(() => {
        if (registerDeck) {
            registerDeck(id, {
                getSyncState: () => syncStateGetterRef.current(),
                applySync: (newPitch: number, nudge: number) => {
                    updatePitch(newPitch); 
                    setPitch(newPitch); 
                    if (Math.abs(nudge) > 0.001) {
                         const targetTime = syncStateGetterRef.current().currentTime + nudge;
                         seek(targetTime);
                    }
                },
                loadTrack: (file: File) => {
                    loadFile(file);
                }
            });
        }
    }, [id, registerDeck, setPitch, seek, loadFile]);


    useEffect(() => {
        if (outputNode) connectToMixer(outputNode, id);
    }, [outputNode, connectToMixer, id]);

    const loadGatePreset = (name: string) => {
        const preset = GATE_PRESETS.find(p => p.name === name);
        if (preset) {
            setGatePattern([...preset.pattern]);
            setGatePresetName(name);
        }
    };

    const toggleGateStep = (index: number) => {
        const newPattern = [...gatePattern];
        newPattern[index] = newPattern[index] === 1 ? 0 : 1;
        setGatePattern(newPattern);
        setGatePresetName('CUSTOM');
    };

    return (
        <div className={`glass-panel p-2 rounded-xl flex flex-col gap-2 relative h-full transition-all duration-300 ${isPlaying ? neonBorder : 'border-white/5'}`}>
            <DeckHeader 
                id={id} color={color} fileName={fileName} audioBuffer={audioBuffer} 
                bpm={bpm} setBpm={setBpm} currentTime={currentTime} duration={duration} 
                isPlaying={isPlaying} analyserNode={analyserNode} loopState={loopState} 
                onSync={onSync || (() => {})} seek={seek} loadFile={loadFile}
            />

            {/* --- MAIN CONTROLS GRID --- */}
            <div className="flex flex-1 gap-2 overflow-hidden">
                
                {/* COL 1: TRANSPORT & LOOP */}
                <TransportSection 
                    id={id} bpm={bpm} isPlaying={isPlaying} hotCues={hotCues} 
                    loopState={loopState} triggerHotCue={triggerHotCue} clearHotCue={clearHotCue} 
                    toggleLoop={toggleLoop} play={play} pause={pause} stop={stop} 
                />

                {/* COL 2: PLATTER & FX */}
                <div className="flex-1 flex flex-col gap-2">
                    <FxSection 
                        fxDist={fxDist} setFxDist={setFxDist}
                        fxDelayAmt={fxDelayAmt} setFxDelayAmt={setFxDelayAmt}
                        fxDelayTime={fxDelayTime} setFxDelayTime={setFxDelayTime}
                        setDistortion={setDistortion} setDelay={setDelay}
                        gateRate={gateRate} setGateRate={setGateRate}
                        gateMix={gateMix} setGateMix={setGateMix}
                        gatePattern={gatePattern} gatePresetName={gatePresetName}
                        loadGatePreset={loadGatePreset} toggleGateStep={toggleGateStep}
                    />

                    <PlatterSection 
                        id={id} audioBuffer={audioBuffer} isPlaying={isPlaying} 
                        isReversed={isReversed} pitch={pitch} 
                        startScratch={startScratch} scratchMovement={scratchMovement} stopScratch={stopScratch}
                    />

                    <SamplerPads 
                        audioContext={audioContext} 
                        connectToMixer={connectToMixer} 
                        id={id} 
                        color={color} 
                    />
                </div>

                {/* COL 3: MIXER STRIP */}
                <MixerStrip 
                    color={color}
                    gain={gain} setGain={updateGain} updateGain={setGain}
                    eqHi={eqHi} setEqHi={updateEqHi}
                    eqMid={eqMid} setEqMid={updateEqMid}
                    eqLow={eqLow} setEqLow={updateEqLow}
                    setEq={setEq}
                    fxNoise={fxNoise} setFxNoise={setFxNoise} setNoise={setNoise}
                    fxFlange={fxFlange} setFxFlange={setFxFlange} setFlange={setFlange}
                    filterVal={filterVal} setFilterVal={updateFilterVal} setOneKnobFilter={setOneKnobFilter}
                    panVal={panVal} setPanVal={updatePanVal} setPan={setPan}
                />

                {/* COL 4: PITCH */}
                <PitchFader 
                    pitch={pitch} 
                    setPitch={(v) => { updatePitch(v); setPitch(v); }} 
                    color={color} 
                />

            </div>
        </div>
    );
};