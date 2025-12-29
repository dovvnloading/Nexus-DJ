
<img width="1873" height="887" alt="Screenshot 2025-12-28 194020" src="https://github.com/user-attachments/assets/3a453cfb-5513-4daf-b084-eba7f5eefdd2" />



---


---



![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-333333?style=for-the-badge&logo=w3c&logoColor=white)

# NEXUS-DJ

**NEXUS-DJ** is a professional-grade, browser-based DJ controller interface engineered with React 19 and the Web Audio API. It replicates the functionality of physical pioneer-standard hardware, featuring a low-latency audio engine, real-time DSP effects, beat synchronization algorithms, and a 16-step trance gate sequencer.

The application operates entirely client-side, utilizing `AudioContext` for sample-accurate playback and processing without external server dependencies.

## Key Features

### Audio Engine
*   **Dual-Deck Architecture:** Independent audio pipelines for Deck A and Deck B with dedicated gain staging.
*   **32-bit Floating Point Processing:** High-fidelity signal path from source to destination.
*   **Real-time DSP:** Integrated Bi-quad filters (EQ), Convolution Reverb, Delay, Distortion, and Flanger effects.
*   **Bi-Polar Color Filter:** Single-knob Low Pass / High Pass filter resonance modeling.

### Performance Tools
*   **Algorithmic Sync Engine:** Phase-aligned beat matching that calculates pitch deltas and nudges playback headers to lock distinct audio sources.
*   **Trance Gate Sequencer:** 16-step rhythmic gating effect with adjustable quantization (1/8, 1/16, 1/32) and lookahead scheduling.
*   **Looping & Glitch Engine:**
    *   **Phrase Looping:** Standard 4/8/16/32 beat loops.
    *   **Roll/Slip Mode:** Momentary 1/8 to 1/1 beat repeats for stutter effects with input quantization.
*   **Hot Cues:** 4 memory points per deck for instant playback jumping.

### Interface & Visualization
*   **Reactive Oscilloscopes:** Real-time frequency analysis rendering to HTML5 Canvas.
*   **Glassmorphic UI:** GPU-accelerated CSS backdrops and filters for a modern aesthetic.
*   **Interactive Inputs:** Custom circular knob and linear fader components with vertical-drag logic, center-detents, and shift-key precision mode.

## Technical Architecture

### Audio Graph Implementation
NEXUS-DJ constructs a complex node graph within the browser's `AudioContext`.

**Signal Path:**
`SourceNode` -> `Gain (Trim)` -> `BiquadFilter (Low/Mid/High)` -> `FX Chain (Flanger -> HPF -> LPF -> Distortion -> Gate)` -> `Channel Fader` -> `Panner` -> `Master Mix`.

**Send/Return Logic:**
A dedicated `ConvolverNode` serves as a global reverb bus. Decks send signals via dedicated `GainNode` sends (Post-Fader) to the reverb unit, which is then summed back into the Master output, simulating hardware mixer routing.

### Scheduling & Timing
To solve the instability of the JavaScript main thread, the Trance Gate sequencer utilizes a Lookahead Scheduler pattern.
1.  **Lookahead:** The system wakes up every 25ms to check for audio events scheduled within the next 100ms.
2.  **Scheduling:** Audio parameters (`gain.setValueAtTime`) are queued directly in the audio thread, ensuring sample-accurate rhythmic gating regardless of main-thread UI blocking.

## Installation & Development

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/nexus-dj.git
    cd nexus-dj
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Build for production:
    ```bash
    npm run build
    ```

## Controls Overview

The interface is designed for mouse and touch interaction.

### Decks
*   **Play/Pause:** Toggles playback.
*   **Cue:** Returns playhead to the last set cue point.
*   **Jog Wheel:**
    *   **Top Surface:** Scratch/Seek audio.
    *   **Outer Ring:** Nudge pitch (Bend).
*   **Sync:** Automatically matches BPM and aligns phase with the opposing deck.

### Mixer
*   **Knobs:** Click and drag vertically to adjust.
    *   **Shift + Drag:** Fine tune/precision mode.
    *   **Double Click:** Reset to default value.
    *   **Right Click:** Reset to default/center.
*   **Crossfader:** Blends audio between Deck A and Deck B. Toggle "Curve" for sharp (scratch) or soft (mix) transitions.

### Sampler & FX
*   **Pads:** Trigger one-shot samples. Switch to "LOAD" mode to import custom audio files from the local filesystem.
*   **Roll Buttons:** Left-click for momentary loop; Right-click to latch the loop.

## License

This project is licensed under the MIT License.

---

*Note: This application requires a modern browser with support for the Web Audio API and AudioWorklet. Performance may vary based on hardware capabilities.*
