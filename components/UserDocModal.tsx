import React from 'react';

interface UserDocModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserDocModal: React.FC<UserDocModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]" onClick={onClose}></div>
            <div className="relative w-full max-w-4xl h-full max-h-full bg-[#121214] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] font-sans">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02] shrink-0">
                    <div>
                        <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
                            User Manual <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">v2.4</span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">NEXUS-DJ Professional Controller Guide</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    
                    {/* Section 1: Overview */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">1. Interface Overview</h3>
                        <p className="text-gray-300 text-base leading-7">
                            NEXUS-DJ is a dual-deck glassmorphic DJ controller designed for high-performance mixing. 
                            It features two identical decks (A & B) and a central mixer section with integrated effects processing.
                            Each deck is equipped with a state-of-the-art audio engine supporting real-time manipulation.
                        </p>
                    </section>

                    {/* Section 2: Deck Controls */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">2. Deck Controls</h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-white font-medium text-sm mb-3 uppercase tracking-wider text-blue-400">Transport & Navigation</h4>
                                <ul className="space-y-4 text-sm text-gray-300">
                                    <li className="flex gap-3">
                                        <span className="text-gray-500">•</span> 
                                        <span><strong className="text-white block mb-1">Play/Pause</strong> Toggles playback. Large tactile button for easy access during performance.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-gray-500">•</span> 
                                        <span><strong className="text-white block mb-1">Cue</strong> Returns to the last set cue point and stops playback immediately.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-gray-500">•</span> 
                                        <span><strong className="text-white block mb-1">Hot Cues (1-4)</strong> Instant jump triggers to saved positions. Right-click a pad to clear the stored cue.</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-sm mb-3 uppercase tracking-wider text-blue-400">Jog Wheel & Pitch</h4>
                                <ul className="space-y-4 text-sm text-gray-300">
                                    <li className="flex gap-3">
                                        <span className="text-gray-500">•</span> 
                                        <span><strong className="text-white block mb-1">Scratch</strong> Touch the top surface of the platter to scratch audio like vinyl.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-gray-500">•</span> 
                                        <span><strong className="text-white block mb-1">Pitch Bend</strong> Nudge the outer ring or empty space to temporarily speed up or slow down for manual beatmatching.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-gray-500">•</span> 
                                        <span><strong className="text-white block mb-1">Tempo Fader</strong> Adjusts track BPM by +/- 8% range for precise synchronization.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                     {/* Section 3: Creative FX */}
                     <section>
                        <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">3. Creative FX Engine</h3>
                        <div className="space-y-6">
                            <div className="bg-white/5 p-5 rounded-lg border border-white/5">
                                <h4 className="text-white font-medium text-base mb-2">Loop & Glitch Roll</h4>
                                <p className="text-sm text-gray-300 mb-4 leading-6">
                                    Located in the transport section, providing two distinctive modes of looping for performance flexibility.
                                </p>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <strong className="text-sm text-white block mb-1">Phrase Loop (4, 8, 16, 32)</strong>
                                        <p className="text-xs text-gray-400 leading-5">Standard beat-synced loops. Click to toggle on/off. Useful for extending intros or outros.</p>
                                    </div>
                                    <div>
                                        <strong className="text-sm text-white block mb-1">Roll / Glitch (1/8 - 1/1)</strong>
                                        <p className="text-xs text-gray-400 leading-5">Performance loops for build-ups and chops.</p>
                                        <ul className="text-xs mt-2 space-y-1 text-gray-400">
                                            <li><span className="text-blue-400 font-medium">Left Click:</span> Momentary (Hold to loop)</li>
                                            <li><span className="text-blue-400 font-medium">Right Click:</span> Latch (Toggle on/off)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-white font-medium text-base mb-2">Trance Gate & FX Chain</h4>
                                <p className="text-sm text-gray-300 leading-6 mb-4">
                                    Rhythmic volume gating effect. Select a preset or draw your own pattern on the 16-step grid. 
                                    Use the <strong>Gate Mix</strong> knob to blend the effect intensity.
                                </p>
                                <div className="flex gap-4">
                                    <div className="bg-white/5 px-3 py-2 rounded text-xs text-gray-300 border border-white/10">Drive (Distortion)</div>
                                    <div className="bg-white/5 px-3 py-2 rounded text-xs text-gray-300 border border-white/10">Echo (Feedback)</div>
                                    <div className="bg-white/5 px-3 py-2 rounded text-xs text-gray-300 border border-white/10">Time (Delay Rate)</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Mixer */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">4. Mixer & DSP</h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li><strong className="text-white">EQ (Hi/Mid/Low):</strong> Full kill 3-band equalizer for sculpting sound.</li>
                                <li><strong className="text-white">Filter:</strong> Bi-polar Color Filter. Turn left for Low Pass, right for High Pass.</li>
                                <li><strong className="text-white">Channel FX:</strong> Dedicated Noise generator and Flanger per channel.</li>
                                <li><strong className="text-white">Sampler:</strong> 4-pad sampler per deck. Switch modes to Load files or Play one-shots.</li>
                            </ul>
                            <div className="bg-blue-500/5 p-5 rounded border border-blue-500/10">
                                <h4 className="text-sm font-bold text-blue-200 mb-2">DSP Reverb Unit</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    The mixer features a central DSP Reverb unit. Use the <strong>Snd A</strong> and <strong>Snd B</strong> knobs in the center mixer section to send signal from the decks to the reverb bus. 
                                    Adjust <strong>Time</strong> and <strong>Size</strong> to shape the room acoustics.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
                
                {/* Footer */}
                <div className="p-5 border-t border-white/10 bg-black/20 text-xs text-gray-500 text-center font-medium">
                    NEXUS AUDIO SYSTEMS © 2025 // ALL RIGHTS RESERVED
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};