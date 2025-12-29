
export const COLORS = {
    deckA: '#ec4899', // Pink-500
    deckB: '#3b82f6', // Blue-500
    bgDark: '#0f172a',
    glassBorder: 'rgba(255,255,255,0.1)',
    knobIndicator: '#ffffff'
};

export const AUDIO_CONSTANTS = {
    DEFAULT_FILTER_FREQ: 22000,
    MIN_FILTER_FREQ: 20,
    MAX_FILTER_FREQ: 22000,
    DEFAULT_RES: 1,
    MAX_RES: 20,
    MAX_GAIN: 1.5,
    FX_DEFAULT_DELAY: 0.33,
};

export const GATE_PRESETS = [
    { name: 'TRANCE 1', pattern: [1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1] },
    { name: 'CHOPPER',  pattern: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0] },
    { name: 'GALOP',    pattern: [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1] },
    { name: 'OFFBEAT',  pattern: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0] },
    { name: 'BROKEN',   pattern: [1,1,0,0, 1,0,0,1, 0,0,1,0, 1,1,1,0] },
    { name: 'PEAK',     pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0] },
    { name: 'FULL',     pattern: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1] },
];
