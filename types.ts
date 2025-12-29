
export enum DeckId {
    A = 'A',
    B = 'B'
}

export interface DeckState {
    id: DeckId;
    file: File | null;
    fileName: string | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
    volume: number;
    gain: number; // Pre-fader gain
    lowCut: number;
    midCut: number;
    highCut: number;
    filterFreq: number;
    filterRes: number;
    loopActive: boolean;
    loopStart: number | null;
    loopLength: number; // in beats (relative) or seconds
}

export interface MixerState {
    crossfader: number; // -1 (A) to 1 (B)
    masterVolume: number;
}

export interface DeckSyncState {
    bpm: number;
    pitch: number;
    currentTime: number;
    isPlaying: boolean;
    duration: number;
}

export interface DeckControls {
    getSyncState: () => DeckSyncState;
    applySync: (newPitch: number, nudge: number) => void;
    loadTrack: (file: File) => void;
}
