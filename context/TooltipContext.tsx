import React, { createContext, useContext, useState, useCallback } from 'react';

interface TooltipData {
    title: string;
    description: string;
    x: number;
    y: number;
}

interface TooltipContextType {
    showTooltip: (title: string, description: string, x: number, y: number) => void;
    hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);

    const showTooltip = useCallback((title: string, description: string, x: number, y: number) => {
        setTooltip({ title, description, x, y });
    }, []);

    const hideTooltip = useCallback(() => {
        setTooltip(null);
    }, []);

    return (
        <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
            {children}
            {tooltip && (
                <div 
                    className="fixed z-[9999] pointer-events-none animate-[slideUpFade_0.3s_cubic-bezier(0.2,0.8,0.2,1)]"
                    style={{ 
                        left: Math.min(tooltip.x + 20, window.innerWidth - 300), 
                        top: Math.min(tooltip.y + 20, window.innerHeight - 150), 
                        width: '280px'
                    }}
                >
                    <div className="bg-[#050505]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.05)] relative overflow-hidden flex flex-col p-3">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-sm shadow-[0_0_5px_rgba(34,211,238,0.8)] animate-pulse"></div>
                                <h4 className="text-[10px] font-black tracking-[0.25em] text-cyan-400 uppercase font-[Rajdhani] truncate">
                                    {tooltip.title}
                                </h4>
                            </div>
                            
                            <div className="w-full h-[1px] bg-gradient-to-r from-cyan-500/30 via-transparent to-transparent mb-2"></div>
                            
                            <p className="text-[10px] leading-relaxed text-gray-300 font-mono tracking-wide">
                                {tooltip.description}
                            </p>

                            <div className="mt-3 flex gap-1 opacity-40">
                                <div className="h-[2px] w-2 bg-cyan-500 rounded-full"></div>
                                <div className="h-[2px] w-1 bg-cyan-500 rounded-full"></div>
                            </div>
                        </div>

                        {/* Scanline overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20"></div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </TooltipContext.Provider>
    );
};

export const useTooltipContext = () => {
    const context = useContext(TooltipContext);
    if (!context) throw new Error("useTooltipContext must be used within a TooltipProvider");
    return context;
};