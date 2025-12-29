import React, { useEffect, useState } from 'react';
import { OscilloscopePet } from './OscilloscopePet';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const [textIndex, setTextIndex] = useState(0);
    const [showButton, setShowButton] = useState(false);
    
    // Sci-fi message
    const lines = [
        "SYSTEM_CHECK: COMPLETE.",
        "TARGET_ID: ERIN.",
        "STATUS: MAXIMUM_VOLUME.",
        "PROTOCOL: ENJOY_THE_MUSIC."
    ];

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setTextIndex(0);
            setShowButton(false);
            
            // Text sequence logic
            let currentLine = 0;
            const interval = setInterval(() => {
                currentLine++;
                setTextIndex(currentLine);
                if (currentLine >= lines.length) {
                    clearInterval(interval);
                    setTimeout(() => setShowButton(true), 500);
                }
            }, 1200);

            return () => clearInterval(interval);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            ></div>

            {/* Main Hologram Container */}
            <div className="relative w-full max-w-lg bg-black border border-gray-800 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.2)] flex flex-col items-center animate-[popIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                
                {/* Header Bar */}
                <div className="w-full h-8 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-3">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 tracking-widest">ErN-BOT_v2.0</div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                </div>

                {/* Canvas Area with OscilloscopePet */}
                <div className="relative w-full h-64 bg-[#050505]">
                    <OscilloscopePet />
                    <div className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-500/50 pointer-events-none">
                        FIG. 1: "OSCY"
                    </div>
                    {/* CRT Scanline Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
                </div>

                {/* Text Terminal */}
                <div className="w-full p-6 bg-[#0a0a0a] border-t border-gray-800 min-h-[160px] flex flex-col items-center justify-center">
                    <div className="font-mono text-cyan-400 text-sm tracking-widest space-y-2 text-center w-full">
                        {lines.map((line, i) => (
                            <div 
                                key={i} 
                                className={`transition-all duration-500 ${i <= textIndex ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                            >
                                <span className="text-pink-500 mr-2">{'>'}</span>{line}
                            </div>
                        ))}
                    </div>

                    {/* Button */}
                    <div className={`mt-6 transition-all duration-500 ${showButton ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}>
                        <button 
                            onClick={onClose}
                            className="px-8 py-2 bg-transparent border border-pink-500/50 text-pink-500 font-mono text-xs tracking-[0.3em] hover:bg-pink-500 hover:text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] transition-all rounded-sm uppercase"
                        >
                            Execute
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};