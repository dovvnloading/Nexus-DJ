
import { useEffect, useRef, useState, useCallback } from 'react';

export const useReverb = (audioContext: AudioContext | null) => {
    const inputNodeRef = useRef<GainNode | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);
    
    // Internal Graph
    const preDelayNodeRef = useRef<DelayNode | null>(null);
    const toneNodeRef = useRef<BiquadFilterNode | null>(null);
    const convolverNodeRef = useRef<ConvolverNode | null>(null);
    const makeupGainRef = useRef<GainNode | null>(null);

    // Params
    const [time, setTime] = useState(3.0); // 0.1 to 10s
    const [size, setSize] = useState(0.4); // 0 to 1

    const initNodes = useCallback(() => {
        if (!audioContext) return;
        
        if (!inputNodeRef.current) inputNodeRef.current = audioContext.createGain();
        if (!outputNodeRef.current) outputNodeRef.current = audioContext.createGain();
        
        if (!preDelayNodeRef.current) preDelayNodeRef.current = audioContext.createDelay(1.0);
        if (!toneNodeRef.current) {
            toneNodeRef.current = audioContext.createBiquadFilter();
            toneNodeRef.current.type = 'lowpass';
            toneNodeRef.current.frequency.value = 8000; // Dampen highs
        }
        if (!convolverNodeRef.current) convolverNodeRef.current = audioContext.createConvolver();
        if (!makeupGainRef.current) makeupGainRef.current = audioContext.createGain();

        // Connect Graph
        // Input -> PreDelay -> Tone -> Convolver -> Makeup -> Output
        inputNodeRef.current.disconnect();
        inputNodeRef.current.connect(preDelayNodeRef.current);
        
        preDelayNodeRef.current.disconnect();
        preDelayNodeRef.current.connect(toneNodeRef.current);

        toneNodeRef.current.disconnect();
        toneNodeRef.current.connect(convolverNodeRef.current);

        convolverNodeRef.current.disconnect();
        convolverNodeRef.current.connect(makeupGainRef.current);

        makeupGainRef.current.disconnect();
        makeupGainRef.current.connect(outputNodeRef.current);

    }, [audioContext]);

    // Build Impulse Response
    const updateImpulse = useCallback(() => {
        if (!audioContext || !convolverNodeRef.current) return;

        const rate = audioContext.sampleRate;
        const length = Math.max(Math.floor(rate * time), rate * 0.1); // Min 0.1s
        const impulse = audioContext.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        // Algorithmic generation of a "nice" smooth tail
        // Using noise with exponential decay
        const decayConstant = 4; // Sharpness of exponential curve
        
        for (let i = 0; i < length; i++) {
            const t = i / length;
            // Envelope: swell fast then decay
            let env = Math.pow(1 - t, decayConstant);
            
            // Add some "room" characteristics (early reflection simulation via noise bursts?)
            // Keeping it simple: Decorrelated noise
            left[i] = (Math.random() * 2 - 1) * env;
            right[i] = (Math.random() * 2 - 1) * env;
        }

        convolverNodeRef.current.buffer = impulse;

        // Makeup gain based on time to keep volume relatively consistent
        // Longer tails = more energy, so we might need to attenuate slightly? 
        // Actually Convolver normally normalizes? No. 
        // Let's just give a healthy boost as convolution often drops levels
        if (makeupGainRef.current) {
             makeupGainRef.current.gain.value = 1.5;
        }

    }, [audioContext, time]);

    // Update Nodes when Params Change
    useEffect(() => {
        if (!audioContext) return;
        initNodes();
    }, [audioContext, initNodes]);

    useEffect(() => {
        updateImpulse();
    }, [updateImpulse]);

    useEffect(() => {
        if (preDelayNodeRef.current && audioContext) {
            // Size controls Pre-Delay (0 to 150ms)
            const delay = size * 0.15;
            preDelayNodeRef.current.delayTime.setTargetAtTime(delay, audioContext.currentTime, 0.1);
        }
        if (toneNodeRef.current && audioContext) {
            // Size controls damping? Larger rooms = darker? Or brighter?
            // Let's say larger size = slightly lower cutoff for "distant" feel
            const freq = 12000 - (size * 6000); 
            toneNodeRef.current.frequency.setTargetAtTime(freq, audioContext.currentTime, 0.1);
        }
    }, [size, audioContext]);

    return {
        inputNode: inputNodeRef.current,
        outputNode: outputNodeRef.current,
        time, setTime,
        size, setSize
    };
};
