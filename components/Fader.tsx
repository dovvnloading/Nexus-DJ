import React, { useRef, useState, useEffect } from 'react';
import { useTooltip } from '../hooks/useTooltip';

interface FaderProps {
    value: number;
    min?: number;
    max?: number;
    onChange: (val: number) => void;
    label?: string;
    className?: string;
    height?: string;
    color?: string;
    showTicks?: boolean;
    orientation?: 'vertical' | 'horizontal';
    defaultValue?: number;
    tooltipTitle?: string;
    tooltipDesc?: string;
}

export const Fader: React.FC<FaderProps> = ({ 
    value, min = 0, max = 1, onChange, label, 
    height = 'h-64', className, 
    color = '#ec4899', showTicks = true,
    orientation = 'vertical',
    defaultValue,
    tooltipTitle, tooltipDesc
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const isVertical = orientation === 'vertical';

    const tooltipHandlers = useTooltip(tooltipTitle, tooltipDesc);

    const containerClass = className || (isVertical ? `w-12 ${height}` : 'w-full h-16');

    const handleMouseDown = (e: React.MouseEvent) => {
        if(tooltipHandlers.onMouseDown) tooltipHandlers.onMouseDown();
        e.preventDefault();
        e.stopPropagation();
        
        setIsDragging(true);
        updateValue(e);

        // Lock UI
        if (isVertical) {
            document.body.classList.add('dragging-vertical');
        } else {
            document.body.classList.add('dragging-horizontal');
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const resetValue = defaultValue !== undefined ? defaultValue : min;
        onChange(resetValue);
    };

    const updateValue = (e: MouseEvent | React.MouseEvent) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        
        let percentage = 0;

        if (isVertical) {
            // Calculate relative to the BOTTOM of the track
            const relativeY = rect.bottom - e.clientY;
            // Clamp within track height
            const clampedY = Math.max(0, Math.min(relativeY, rect.height));
            percentage = clampedY / rect.height;
        } else {
            const relativeX = e.clientX - rect.left;
            const clampedX = Math.max(0, Math.min(relativeX, rect.width));
            percentage = clampedX / rect.width;
        }

        const newValue = min + (percentage * (max - min));
        onChange(newValue);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            e.preventDefault();
            e.stopPropagation();
            updateValue(e);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            // Unlock UI
            document.body.classList.remove('dragging-vertical');
            document.body.classList.remove('dragging-horizontal');
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove, { capture: true });
            window.addEventListener('mouseup', handleMouseUp, { capture: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove, { capture: true });
            window.removeEventListener('mouseup', handleMouseUp, { capture: true });
            document.body.classList.remove('dragging-vertical');
            document.body.classList.remove('dragging-horizontal');
        };
    }, [isDragging, min, max, isVertical]);

    const percent = (value - min) / (max - min);

    // Dynamic styles for the cap position
    const capStyle = isVertical 
        ? { bottom: `${percent * 100}%`, left: '50%', transform: 'translate(-50%, 50%)' }
        : { left: `${percent * 100}%`, top: '50%', transform: 'translate(-50%, -50%)' };

    return (
        <div 
            className={`flex flex-col items-center justify-center gap-2 group ${isVertical ? 'h-full' : 'w-full'}`}
            onMouseEnter={tooltipHandlers.onMouseEnter}
            onMouseLeave={tooltipHandlers.onMouseLeave}
            onMouseMove={tooltipHandlers.onMouseMove}
        >
            <div 
                className={`relative bg-[#050505] rounded border border-gray-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] p-2 flex justify-center items-center ${containerClass}`}
                onContextMenu={handleContextMenu}
            >
                {/* Ticks */}
                {showTicks && (
                    <div className={`absolute pointer-events-none opacity-30 flex justify-between z-0 ${isVertical ? 'left-0 top-2 bottom-2 w-full flex-col px-1' : 'top-0 left-2 right-2 h-full flex-row py-1'}`}>
                        {[...Array(11)].map((_, i) => (
                            <div key={i} className={`${isVertical ? 'w-2 h-[1px]' : 'h-2 w-[1px]'} bg-gray-400 ${i === 5 ? (isVertical ? 'w-4 bg-white' : 'h-4 bg-white') : ''}`}></div>
                        ))}
                    </div>
                )}

                {/* The Interactive Rail Area */}
                <div 
                    ref={trackRef}
                    className={`relative z-10 cursor-pointer ${isVertical ? 'h-full w-4' : 'w-full h-4'}`}
                    onMouseDown={handleMouseDown}
                >
                    {/* Track Line */}
                    <div className={`absolute bg-[#111] border border-gray-800 rounded-full pointer-events-none ${isVertical ? 'top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5' : 'left-0 right-0 top-1/2 -translate-y-1/2 h-1.5'}`}></div>
                    
                    {/* Active Fill Level (Optional, adds nice visual feedback) */}
                    <div 
                        className={`absolute bg-gray-700/50 rounded-full pointer-events-none ${isVertical ? 'bottom-0 left-1/2 -translate-x-1/2 w-1' : 'left-0 top-1/2 -translate-y-1/2 h-1'}`}
                        style={isVertical ? { height: `${percent * 100}%` } : { width: `${percent * 100}%` }}
                    ></div>

                    {/* Fader Cap */}
                    <div 
                        className={`absolute bg-gradient-to-b from-[#444] to-[#111] border border-gray-500 rounded shadow-xl pointer-events-none flex items-center justify-center gap-[2px] z-20
                            ${isVertical ? 'w-10 h-6 flex-col' : 'h-10 w-6 flex-row'}
                        `}
                        style={{ 
                            ...capStyle,
                            boxShadow: `0 4px 10px rgba(0,0,0,0.9), 0 0 15px ${color}10, inset 0 1px 0 rgba(255,255,255,0.1)`
                        }}
                    >
                        {/* Grip Lines */}
                        <div className={`${isVertical ? 'w-full h-[1px]' : 'h-full w-[1px]'} bg-black/80`}></div>
                        <div className={`${isVertical ? 'w-full h-[1px]' : 'h-full w-[1px]'} bg-black/80`}></div>
                        {/* Center Indicator */}
                        <div className={`absolute bg-white shadow-[0_0_5px_white] ${isVertical ? 'w-full h-[1px]' : 'h-full w-[1px]'}`}></div>
                    </div>
                </div>
            </div>
            {label && <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors select-none">{label}</span>}
        </div>
    );
};