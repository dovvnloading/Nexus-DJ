import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AUDIO_CONSTANTS } from '../constants';

export const useAudioDeck = (audioContext: AudioContext | null) => {
    // Audio Nodes
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null); // Input Trim
    const eqLowRef = useRef<BiquadFilterNode | null>(null);
    const eqMidRef = useRef<BiquadFilterNode | null>(null);
    const eqHighRef = useRef<BiquadFilterNode | null>(null);
    
    // Channel FX (New)
    const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const noiseGainRef = useRef<GainNode | null>(null);
    
    const flangerInputRef = useRef<GainNode | null>(null);
    const flangerOutputRef = useRef<GainNode | null>(null);
    const flangerDelayRef = useRef<DelayNode | null>(null);
    const flangerFeedbackRef = useRef<GainNode | null>(null);
    const flangerWetRef = useRef<GainNode | null>(null);
    const flangerLfoRef = useRef<OscillatorNode | null>(null);
    const flangerLfoGainRef = useRef<GainNode | null>(null);

    // FX Chain
    const filterLowPassRef = useRef<BiquadFilterNode | null>(null);
    const filterHighPassRef = useRef<BiquadFilterNode | null>(null);
    const distortionNodeRef = useRef<WaveShaperNode | null>(null);
    
    // Gate
    const gateNodeRef = useRef<GainNode | null>(null);

    // Delay
    const delayNodeRef = useRef<DelayNode | null>(null);
    const delayFeedbackRef = useRef<GainNode | null>(null);
    const delayWetRef = useRef<GainNode | null>(null);
    const delayDryRef = useRef<GainNode | null>(null);
    
    // Output
    const volumeNodeRef = useRef<GainNode | null>(null); // Channel Fader
    const pannerRef = useRef<StereoPannerNode | null>(null); // Pan
    const analyserRef = useRef<AnalyserNode | null>(null);
    
    // Node State (Expose to React)
    const [nodesReady, setNodesReady] = useState(false);
    
    // State
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(false);
    const [bpm, setBpm] = useState(174); // Default to DnB tempo
    
    // Gate State
    const [gatePattern, setGatePattern] = useState<number[]>(new Array(16).fill(1));
    const [gateMix, setGateMix] = useState(0); // 0 to 1 (Depth)
    const [gateRate, setGateRate] = useState(16); // 1/16th

    // Hot Cues
    const [hotCues, setHotCues] = useState<(number | null)[]>([null, null, null, null]);

    // Playback modifiers
    const isReversedRef = useRef(false);
    const [isReversed, setIsReversed] = useState(false); // for UI

    // Refs for Scheduler
    const gatePatternRef = useRef(gatePattern);
    const gateMixRef = useRef(gateMix);
    const gateRateRef = useRef(gateRate);
    
    // Internal Playback State
    const startTimeRef = useRef<number>(0); // When playback started in AC time
    const startOffsetRef = useRef<number>(0); // Where in the track we started (seconds)
    const pauseTimeRef = useRef<number>(0); // Used for resume
    
    const isLoopingRef = useRef<boolean>(false);
    const loopStartRef = useRef<number>(0);
    const loopEndRef = useRef<number>(0);
    const loopStartTimeRef = useRef<number>(0); // Timestamp when loop was engaged for visual sync
    
    // Scheduler State
    const nextNoteTimeRef = useRef(0);
    const currentStepRef = useRef(0);
    
    // Scratch / Pitch State
    const pitchRef = useRef<number>(1);
    const isScratchingRef = useRef<boolean>(false);
    const wasPlayingRef = useRef<boolean>(false);

    // Update Refs
    useEffect(() => { gatePatternRef.current = gatePattern; }, [gatePattern]);
    useEffect(() => { gateMixRef.current = gateMix; }, [gateMix]);
    useEffect(() => { gateRateRef.current = gateRate; }, [gateRate]);

    const makeDistortionCurve = (amount: number) => {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
    };

    const initNodes = useCallback(() => {
        if (!audioContext) return;
        
        if (!gainNodeRef.current) gainNodeRef.current = audioContext.createGain();
        
        if (!eqLowRef.current) {
            eqLowRef.current = audioContext.createBiquadFilter();
            eqLowRef.current.type = 'lowshelf';
            eqLowRef.current.frequency.value = 320;
        }
        if (!eqMidRef.current) {
            eqMidRef.current = audioContext.createBiquadFilter();
            eqMidRef.current.type = 'peaking';
            eqMidRef.current.frequency.value = 1000;
            eqMidRef.current.Q.value = 0.5;
        }
        if (!eqHighRef.current) {
            eqHighRef.current = audioContext.createBiquadFilter();
            eqHighRef.current.type = 'highshelf';
            eqHighRef.current.frequency.value = 3200;
        }

        if (!noiseGainRef.current) {
            noiseGainRef.current = audioContext.createGain();
            noiseGainRef.current.gain.value = 0;
            const bufferSize = audioContext.sampleRate * 2;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.4;
            }
            noiseSourceRef.current = audioContext.createBufferSource();
            noiseSourceRef.current.buffer = buffer;
            noiseSourceRef.current.loop = true;
            noiseSourceRef.current.connect(noiseGainRef.current);
            try { noiseSourceRef.current.start(); } catch(e) {}
        }

        if (!flangerInputRef.current) {
            flangerInputRef.current = audioContext.createGain();
            flangerOutputRef.current = audioContext.createGain();
            flangerDelayRef.current = audioContext.createDelay(0.1);
            flangerFeedbackRef.current = audioContext.createGain();
            flangerWetRef.current = audioContext.createGain();
            flangerLfoRef.current = audioContext.createOscillator();
            flangerLfoGainRef.current = audioContext.createGain();

            flangerDelayRef.current.delayTime.value = 0.005;
            flangerFeedbackRef.current.gain.value = 0.5;
            flangerWetRef.current.gain.value = 0;
            
            flangerLfoRef.current.type = 'sine';
            flangerLfoRef.current.frequency.value = 0.25;
            flangerLfoGainRef.current.gain.value = 0.002;
            
            flangerLfoRef.current.connect(flangerLfoGainRef.current);
            flangerLfoGainRef.current.connect(flangerDelayRef.current.delayTime);
            try { flangerLfoRef.current.start(); } catch(e) {}
            
            flangerInputRef.current.connect(flangerOutputRef.current);
            flangerInputRef.current.connect(flangerDelayRef.current);
            flangerDelayRef.current.connect(flangerWetRef.current);
            flangerWetRef.current.connect(flangerOutputRef.current);
            flangerDelayRef.current.connect(flangerFeedbackRef.current);
            flangerFeedbackRef.current.connect(flangerDelayRef.current);
        }

        if (!filterLowPassRef.current) {
            filterLowPassRef.current = audioContext.createBiquadFilter();
            filterLowPassRef.current.type = 'lowpass';
            filterLowPassRef.current.frequency.value = 22000;
        }
        if (!filterHighPassRef.current) {
            filterHighPassRef.current = audioContext.createBiquadFilter();
            filterHighPassRef.current.type = 'highpass';
            filterHighPassRef.current.frequency.value = 0;
        }

        if (!distortionNodeRef.current) {
            distortionNodeRef.current = audioContext.createWaveShaper();
            distortionNodeRef.current.curve = makeDistortionCurve(0);
            distortionNodeRef.current.oversample = '4x';
        }

        if (!gateNodeRef.current) {
            gateNodeRef.current = audioContext.createGain();
            gateNodeRef.current.gain.value = 1;
        }

        if (!delayNodeRef.current) {
            delayNodeRef.current = audioContext.createDelay(2.0);
            delayNodeRef.current.delayTime.value = 0.33;
        }
        if (!delayFeedbackRef.current) {
            delayFeedbackRef.current = audioContext.createGain();
            delayFeedbackRef.current.gain.value = 0.4;
        }
        if (!delayWetRef.current) {
            delayWetRef.current = audioContext.createGain();
            delayWetRef.current.gain.value = 0;
        }
        if (!delayDryRef.current) {
            delayDryRef.current = audioContext.createGain();
            delayDryRef.current.gain.value = 1;
        }

        if (!volumeNodeRef.current) volumeNodeRef.current = audioContext.createGain();
        if (!pannerRef.current) pannerRef.current = audioContext.createStereoPanner();
        if (!analyserRef.current) {
            analyserRef.current = audioContext.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.5;
        }

        gainNodeRef.current.disconnect();
        eqLowRef.current.disconnect();
        eqMidRef.current.disconnect();
        eqHighRef.current.disconnect();
        
        gainNodeRef.current.connect(eqLowRef.current);
        eqLowRef.current.connect(eqMidRef.current);
        eqMidRef.current.connect(eqHighRef.current);
        
        eqHighRef.current.connect(flangerInputRef.current!);
        flangerOutputRef.current!.disconnect();
        flangerOutputRef.current!.connect(filterHighPassRef.current);

        noiseGainRef.current!.disconnect();
        noiseGainRef.current!.connect(filterHighPassRef.current);
        
        filterHighPassRef.current.disconnect();
        filterHighPassRef.current.connect(filterLowPassRef.current);
        
        filterLowPassRef.current.disconnect();
        filterLowPassRef.current.connect(distortionNodeRef.current);
        
        distortionNodeRef.current.disconnect();
        distortionNodeRef.current.connect(gateNodeRef.current);

        gateNodeRef.current.disconnect();
        gateNodeRef.current.connect(delayDryRef.current);
        delayDryRef.current.disconnect();
        delayDryRef.current.connect(volumeNodeRef.current);

        gateNodeRef.current.connect(delayNodeRef.current);
        delayNodeRef.current.disconnect();
        delayNodeRef.current.connect(delayFeedbackRef.current);
        delayFeedbackRef.current.disconnect();
        delayFeedbackRef.current.connect(delayNodeRef.current);
        delayNodeRef.current.connect(delayWetRef.current);
        delayWetRef.current.disconnect();
        delayWetRef.current.connect(volumeNodeRef.current);

        volumeNodeRef.current.disconnect();
        volumeNodeRef.current.connect(pannerRef.current);
        pannerRef.current.disconnect();
        pannerRef.current.connect(analyserRef.current);
        
        setNodesReady(true);
        
    }, [audioContext]);

    useEffect(() => {
        initNodes();
    }, [initNodes]);

    useEffect(() => {
        if (!isPlaying || !audioContext || !gateNodeRef.current) return;

        const lookahead = 25.0;
        const scheduleAheadTime = 0.1;

        let timerID: number;

        const nextNote = () => {
            const secondsPerBeat = 60.0 / bpm;
            const stepsPerBeat = gateRateRef.current / 4; 
            const secondsPerStep = secondsPerBeat / stepsPerBeat;

            nextNoteTimeRef.current += secondsPerStep;
            currentStepRef.current++;
            if (currentStepRef.current >= gatePatternRef.current.length) {
                currentStepRef.current = 0;
            }
        };

        const scheduleNote = (stepIndex: number, time: number) => {
            if (!gateNodeRef.current) return;
            const mix = gateMixRef.current;
            const isActive = gatePatternRef.current[stepIndex] === 1;
            const targetGain = isActive ? 1 : (1 - mix);

            gateNodeRef.current.gain.cancelScheduledValues(time);
            gateNodeRef.current.gain.setValueAtTime(gateNodeRef.current.gain.value, time);
            gateNodeRef.current.gain.setTargetAtTime(targetGain, time, 0.003);
        };

        const scheduler = () => {
            while (nextNoteTimeRef.current < audioContext.currentTime + scheduleAheadTime) {
                scheduleNote(currentStepRef.current, nextNoteTimeRef.current);
                nextNote();
            }
            timerID = window.setTimeout(scheduler, lookahead);
        };

        nextNoteTimeRef.current = audioContext.currentTime;
        currentStepRef.current = 0;
        scheduler();

        return () => {
            window.clearTimeout(timerID);
            if (gateNodeRef.current) {
                gateNodeRef.current.gain.cancelScheduledValues(audioContext.currentTime);
                gateNodeRef.current.gain.setTargetAtTime(1, audioContext.currentTime, 0.1);
            }
        };
    }, [isPlaying, bpm, audioContext]);

    const loadFile = async (file: File) => {
        if (!audioContext) return;
        setLoading(true);
        setIsPlaying(false);
        setFileName(file.name);
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch(e) {}
            sourceNodeRef.current.disconnect();
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setAudioBuffer(decodedBuffer);
            setDuration(decodedBuffer.duration);
            pauseTimeRef.current = 0;
            setCurrentTime(0);
            startOffsetRef.current = 0;
            isLoopingRef.current = false;
            loopStartRef.current = 0;
            loopEndRef.current = 0;
        } catch (error) {
            console.error("Error decoding audio", error);
        } finally {
            setLoading(false);
        }
    };

    const updatePlaybackRate = () => {
        if (sourceNodeRef.current) {
            const rate = pitchRef.current * (isReversedRef.current ? -1 : 1);
            sourceNodeRef.current.playbackRate.setTargetAtTime(rate, audioContext?.currentTime || 0, 0.05);
        }
    };

    // Helper to snap current audio position to refs to prevent drift when changing rates
    const syncTimeRefs = () => {
        if (!audioContext || !isPlaying) return;
        const elapsed = audioContext.currentTime - startTimeRef.current;
        // Use the 'rate' that was active *before* this change if we tracked it, 
        // but here we just snapshot current state. 
        // Note: Ideally we track rate changes over time, but snapshotting on change minimizes error.
        const rate = pitchRef.current * (isReversedRef.current ? -1 : 1);
        let currentPos = startOffsetRef.current + (elapsed * rate);
        
        // Handle wrap-around for calculation
        if (duration > 0) {
            // Simple normalization for basic playback
            if (currentPos >= duration || currentPos < 0) {
                 const rem = currentPos % duration;
                 currentPos = rem < 0 ? rem + duration : rem;
            }
        }

        startOffsetRef.current = currentPos;
        startTimeRef.current = audioContext.currentTime;
    };

    const play = useCallback(() => {
        if (!audioContext || !audioBuffer || !gainNodeRef.current) return;
        if (isPlaying && !isScratchingRef.current) return; 

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (sourceNodeRef.current && isPlaying) return;

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        if (isLoopingRef.current) {
            source.loop = true;
            source.loopStart = loopStartRef.current;
            source.loopEnd = loopEndRef.current;
        }
        
        const rate = pitchRef.current * (isReversedRef.current ? -1 : 1);
        source.playbackRate.value = rate;
        source.connect(gainNodeRef.current!);
        
        let offset = pauseTimeRef.current;
        if (!Number.isFinite(offset)) offset = 0;
        if (offset >= audioBuffer.duration) offset = 0;
        if (offset < 0) offset = 0;
        
        startOffsetRef.current = offset;
        startTimeRef.current = audioContext.currentTime;
        
        source.start(0, offset);
        
        sourceNodeRef.current = source;
        setIsPlaying(true);
    }, [audioContext, audioBuffer, isPlaying]);

    const pause = useCallback(() => {
        if (!sourceNodeRef.current || !isPlaying || !audioContext) return;
        try {
            sourceNodeRef.current.stop();
            // Recalculate pause time accurately
            const elapsed = audioContext.currentTime - startTimeRef.current;
            const rate = pitchRef.current * (isReversedRef.current ? -1 : 1);
            let pos = startOffsetRef.current + (elapsed * rate);
            // Normalize
            if (duration > 0) {
                const rem = pos % duration;
                pos = rem < 0 ? rem + duration : rem;
            }
            pauseTimeRef.current = pos;
        } catch (e) { console.error(e); }
        setIsPlaying(false);
    }, [isPlaying, audioContext, duration]);

    const stop = useCallback(() => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch(e) {}
        }
        setIsPlaying(false);
        pauseTimeRef.current = 0;
        setCurrentTime(0);
        startOffsetRef.current = 0;
        isLoopingRef.current = false;
        if (isReversedRef.current) {
            isReversedRef.current = false;
            setIsReversed(false);
        }
    }, []);

    const tapeStop = useCallback((stopDuration: number = 0.8) => {
        if (!sourceNodeRef.current || !audioContext) return;
        syncTimeRefs(); // Sync before effect
        isScratchingRef.current = true; 

        const t = audioContext.currentTime;
        try {
            sourceNodeRef.current.playbackRate.cancelScheduledValues(t);
            sourceNodeRef.current.playbackRate.setValueAtTime(sourceNodeRef.current.playbackRate.value, t);
            sourceNodeRef.current.playbackRate.exponentialRampToValueAtTime(0.001, t + stopDuration);
            sourceNodeRef.current.stop(t + stopDuration);
        } catch(e) {}
        
        setTimeout(() => {
            setIsPlaying(false);
            isScratchingRef.current = false;
        }, stopDuration * 1000);
    }, [audioContext]);

    const seek = useCallback((time: number) => {
        if (!audioBuffer || !audioContext) return;
        
        if (!Number.isFinite(time)) time = 0;

        const newTime = Math.max(0, Math.min(time, duration));
        
        pauseTimeRef.current = newTime;
        startOffsetRef.current = newTime;
        startTimeRef.current = audioContext.currentTime;
        setCurrentTime(newTime);
        
        if (isPlaying) {
             if (sourceNodeRef.current) {
                 try { sourceNodeRef.current.stop(); } catch(e) {}
             }
             
             const source = audioContext.createBufferSource();
             source.buffer = audioBuffer;
             const rate = pitchRef.current * (isReversedRef.current ? -1 : 1);
             source.playbackRate.value = rate;
             
             if (isLoopingRef.current) {
                 source.loop = true;
                 source.loopStart = loopStartRef.current;
                 source.loopEnd = loopEndRef.current;
             }

             source.connect(gainNodeRef.current!);
             source.start(0, newTime);
             sourceNodeRef.current = source;
        }
    }, [audioBuffer, duration, isPlaying, audioContext]);

    const setPitch = (rate: number) => { 
        syncTimeRefs();
        pitchRef.current = rate; 
        updatePlaybackRate(); 
    };
    
    const setGain = (val: number) => { if (gainNodeRef.current) gainNodeRef.current.gain.setTargetAtTime(val, audioContext?.currentTime || 0, 0.05); };
    const setVolume = (val: number) => { if (volumeNodeRef.current) volumeNodeRef.current.gain.setTargetAtTime(val, audioContext?.currentTime || 0, 0.05); };
    const setPan = (val: number) => { if (pannerRef.current) pannerRef.current.pan.setTargetAtTime(val, audioContext?.currentTime || 0, 0.1); };
    const setOneKnobFilter = (value: number) => { 
        if (!filterLowPassRef.current || !filterHighPassRef.current || !audioContext) return;
        const t = audioContext.currentTime;
        const timeConst = 0.1;
        if (value < 0.5) {
            const normalized = value * 2; 
            const freq = 20 * Math.pow(22000/20, normalized);
            filterLowPassRef.current.frequency.setTargetAtTime(freq, t, timeConst);
            filterHighPassRef.current.frequency.setTargetAtTime(0, t, timeConst); 
        } else {
            const normalized = (value - 0.5) * 2;
            const freq = 20 * Math.pow(22000/20, normalized);
            filterLowPassRef.current.frequency.setTargetAtTime(22000, t, timeConst); 
            filterHighPassRef.current.frequency.setTargetAtTime(freq, t, timeConst);
        }
    };
    const setEq = (type: 'low' | 'mid' | 'high', gain: number) => {
        const t = audioContext?.currentTime || 0;
        if (type === 'low' && eqLowRef.current) eqLowRef.current.gain.setTargetAtTime(gain, t, 0.1);
        if (type === 'mid' && eqMidRef.current) eqMidRef.current.gain.setTargetAtTime(gain, t, 0.1);
        if (type === 'high' && eqHighRef.current) eqHighRef.current.gain.setTargetAtTime(gain, t, 0.1);
    };
    const setDistortion = (amount: number) => { 
        if (distortionNodeRef.current) {
            const k = amount * 400;
            distortionNodeRef.current.curve = makeDistortionCurve(k);
        }
    };
    const setDelay = (wet: number, time: number) => {
        const t = audioContext?.currentTime || 0;
        if (delayWetRef.current) delayWetRef.current.gain.setTargetAtTime(wet, t, 0.1);
        if (delayDryRef.current) delayDryRef.current.gain.setTargetAtTime(1 - (wet * 0.5), t, 0.1); 
        if (delayNodeRef.current) delayNodeRef.current.delayTime.setTargetAtTime(time, t, 0.1);
    };
    const setNoise = (amount: number) => {
        const t = audioContext?.currentTime || 0;
        if (noiseGainRef.current) noiseGainRef.current.gain.setTargetAtTime(amount, t, 0.1);
    };
    const setFlange = (amount: number) => {
        const t = audioContext?.currentTime || 0;
        if (flangerWetRef.current) flangerWetRef.current.gain.setTargetAtTime(amount, t, 0.1);
    };

    const toggleLoop = (beats: number) => {
        if (!audioContext || !audioBuffer || !gainNodeRef.current) return;
        
        const t = audioContext.currentTime;

        if (beats === 0) {
            // --- DISABLE LOOP (EXIT) ---
            if (isLoopingRef.current && sourceNodeRef.current) {
                const loopLen = loopEndRef.current - loopStartRef.current;
                
                // Calculate correct exit position to maintain linear continuity logic
                const timeSinceLoopStart = t - loopStartTimeRef.current;
                const rate = pitchRef.current * (isReversedRef.current ? -1 : 1);
                
                // Calculate where the playback head physically is inside the loop
                // This ensures we resume the 'virtual' timeline from the correct spot
                let progress = (timeSinceLoopStart * Math.abs(rate)) % loopLen;
                if (progress < 0) progress += loopLen;

                let exitPos = loopStartRef.current + progress;
                // If using reverse playback logic, math might differ, but assuming loopStartRef is always the anchor
                
                // Turn off looping on the audio node
                sourceNodeRef.current.loop = false;
                
                // Sync State
                startOffsetRef.current = exitPos;
                startTimeRef.current = t;
                
                isLoopingRef.current = false;
                loopStartRef.current = 0;
                loopEndRef.current = 0;
                loopStartTimeRef.current = 0;
            }
        } else {
            // --- ENABLE LOOP (ROLL/LOOP) ---
            // Precise re-creation of source node for instant glitch/roll response
            
            const beatDuration = 60 / bpm; 
            const loopLength = beatDuration * beats;
            
            // Calculate exact current position
            const elapsed = t - startTimeRef.current;
            const rate = pitchRef.current * (isReversedRef.current ? -1 : 1);
            let currentPos = startOffsetRef.current + (elapsed * rate);
            
            // Normalize
            if (duration > 0) {
                 const rem = currentPos % duration;
                 currentPos = rem < 0 ? rem + duration : rem;
            }

            const safeEnd = Math.min(currentPos + loopLength, duration);

            // STOP EXISTING
            if (sourceNodeRef.current) {
                try { sourceNodeRef.current.stop(); } catch(e) {}
                sourceNodeRef.current.disconnect();
            }

            // CREATE NEW
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = rate;
            source.loop = true;
            source.loopStart = currentPos;
            source.loopEnd = safeEnd;
            source.connect(gainNodeRef.current);
            
            // START IMMEDIATELY
            source.start(0, currentPos);
            
            sourceNodeRef.current = source;
            setIsPlaying(true);

            // UPDATE REFS
            startOffsetRef.current = currentPos;
            startTimeRef.current = t;
            isLoopingRef.current = true;
            loopStartRef.current = currentPos;
            loopEndRef.current = safeEnd;
            loopStartTimeRef.current = t;
        }
    };

    const toggleReverse = () => {
        syncTimeRefs();
        isReversedRef.current = !isReversedRef.current;
        setIsReversed(isReversedRef.current);
        if (audioContext && isPlaying) seek(currentTime); // Seek actually rebuilds node, which is easiest way to reverse reliably
        else updatePlaybackRate();
    };

    const triggerHotCue = (index: number) => {
        if (hotCues[index] !== null) {
            seek(hotCues[index]!);
        } else {
            const newCues = [...hotCues];
            // Capture precise time for cue
            const elapsed = audioContext ? (audioContext.currentTime - startTimeRef.current) : 0;
            const rate = pitchRef.current * (isReversedRef.current ? -1 : 1);
            let pos = startOffsetRef.current + (elapsed * rate);
            if (duration > 0) { const rem = pos % duration; pos = rem < 0 ? rem + duration : rem; }
            
            newCues[index] = pos;
            setHotCues(newCues);
        }
    };

    const clearHotCue = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newCues = [...hotCues];
        newCues[index] = null;
        setHotCues(newCues);
    };

    const startScratch = () => {
        if (!audioContext) return;
        syncTimeRefs(); // Sync before scratch
        isScratchingRef.current = true;
        wasPlayingRef.current = isPlaying;
        
        if (!isPlaying) {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(gainNodeRef.current!);
            source.playbackRate.value = 0;
            let startPos = currentTime;
            if (!Number.isFinite(startPos)) startPos = 0;
            source.start(0, startPos);
            sourceNodeRef.current = source;
            startTimeRef.current = audioContext.currentTime;
            startOffsetRef.current = startPos;
            setIsPlaying(true);
        }
        
        if (sourceNodeRef.current) {
             sourceNodeRef.current.playbackRate.cancelScheduledValues(audioContext.currentTime);
             sourceNodeRef.current.playbackRate.setValueAtTime(0, audioContext.currentTime);
        }
    };

    const scratchMovement = (velocityRatio: number) => {
        if (!sourceNodeRef.current || !audioContext) return;
        sourceNodeRef.current.playbackRate.setValueAtTime(velocityRatio, audioContext.currentTime);
    };

    const stopScratch = () => {
        isScratchingRef.current = false;
        if (!sourceNodeRef.current || !audioContext) return;

        if (wasPlayingRef.current) {
            const rate = pitchRef.current * (isReversedRef.current ? -1 : 1);
            sourceNodeRef.current.playbackRate.setTargetAtTime(rate, audioContext.currentTime, 0.05);
            // Re-sync time tracking to current visual time which was updated during scratch
            startTimeRef.current = audioContext.currentTime;
            startOffsetRef.current = currentTime; // currentTime is updated by loop during scratch
        } else {
            pause();
        }
    };

    // --- MAIN LOOP ---
    useEffect(() => {
        let rafId: number;
        let lastTime = performance.now();

        const update = () => {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            if (isPlaying && audioContext) {
                if (isScratchingRef.current && sourceNodeRef.current) {
                    const currentRate = sourceNodeRef.current.playbackRate.value;
                    setCurrentTime(prev => {
                         let next = prev + (dt * currentRate);
                         if (next < 0) next = 0;
                         if (next > duration) next = duration;
                         return next;
                    });
                } else {
                    const elapsed = audioContext.currentTime - startTimeRef.current;
                    const rate = pitchRef.current * (isReversedRef.current ? -1 : 1);
                    let next = startOffsetRef.current + (elapsed * rate);
                    if (!Number.isFinite(next)) next = 0;

                    if (isLoopingRef.current && loopEndRef.current > loopStartRef.current) {
                         const loopLen = loopEndRef.current - loopStartRef.current;
                         // Sync visual playhead to actual loop time to prevent jitter
                         // timeInLoop = (realTime - loopEngageTime) % loopLen
                         // playhead = loopStart + timeInLoop
                         const timeSinceLoop = (audioContext.currentTime - loopStartTimeRef.current) * Math.abs(rate);
                         const progress = timeSinceLoop % loopLen;
                         
                         if (rate > 0) {
                             next = loopStartRef.current + progress;
                         } else {
                             // Reverse loop visual logic is tricky, simplifying fallback to standard wrapping
                             if (next < loopStartRef.current) next = loopEndRef.current - (loopStartRef.current - next);
                         }
                    } else {
                        if (duration > 0) {
                             if (next >= duration) next = next % duration;
                             if (next < 0) next = duration + next; 
                        }
                    }
                    setCurrentTime(next);
                }
            }
            rafId = requestAnimationFrame(update);
        };
        update();
        return () => cancelAnimationFrame(rafId);
    }, [isPlaying, audioContext, duration]);

    return {
        loadFile, play, pause, stop, tapeStop, seek,
        setPitch, setGain, setVolume, setPan,
        setOneKnobFilter, setEq, setDistortion, setDelay,
        setNoise, setFlange,
        toggleLoop, startScratch, scratchMovement, stopScratch,
        bpm, setBpm,
        gatePattern, setGatePattern, gateMix, setGateMix, gateRate, setGateRate,
        hotCues, triggerHotCue, clearHotCue, toggleReverse, isReversed,
        audioBuffer, isPlaying, currentTime, duration, loading, fileName,
        analyserNode: nodesReady ? analyserRef.current : null,
        outputNode: nodesReady ? analyserRef.current : null,
        loopState: { active: isLoopingRef.current, start: loopStartRef.current, end: loopEndRef.current }
    };
};