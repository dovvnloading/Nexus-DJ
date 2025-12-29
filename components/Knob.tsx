import React, { useState, useEffect, useRef } from 'react';
import { useTooltip } from '../hooks/useTooltip';

interface KnobProps {
    label: string;
    min: number;
    max: number;
    value: number;
    onChange: (val: number) => void;
    color?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    centerZero?: boolean;
    defaultValue?: number;
    tooltipTitle?: string;
    tooltipDesc?: string;
    doubleClickToReset?: boolean;
}

export const Knob: React.FC<KnobProps> = ({ 
    label, min, max, value, onChange, color = '#ec4899', size = 'md', centerZero = false, defaultValue,
    tooltipTitle, tooltipDesc, doubleClickToReset = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const startYRef = useRef<number>(0);
    const startValueRef = useRef<number>(0);

    const tooltipHandlers = useTooltip(tooltipTitle, tooltipDesc);

    const percent = (value - min) / (max - min);
    const degrees = -135 + (percent * 270); // -135 to +135
    
    const sizeMap = {
        xs: 32,
        sm: 40,
        md: 64,
        lg: 80,
        xl: 96
    };
    const pxSize = sizeMap[size];

    const handleMouseDown = (e: React.MouseEvent) => {
        if (tooltipHandlers.onMouseDown) tooltipHandlers.onMouseDown();
        e.preventDefault(); // Critical: Prevent text selection immediately
        e.stopPropagation();
        
        setIsDragging(true);
        startYRef.current = e.clientY;
        startValueRef.current = value;
        
        // Lock the UI
        document.body.classList.add('dragging-vertical');
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        let resetValue = min;
        if (defaultValue !== undefined) {
            resetValue = defaultValue;
        } else if (centerZero) {
            resetValue = (min + max) / 2;
        }
        onChange(resetValue);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (doubleClickToReset) {
            e.preventDefault();
            e.stopPropagation();
            onChange(min);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            e.preventDefault();
            e.stopPropagation();
            
            const deltaY = startYRef.current - e.clientY;
            const range = max - min;
            
            // Professional feel: ~250px for full rotation
            const fullRangePx = 250;
            const sensitivity = e.shiftKey ? 0.2 : 1.0; // Shift for fine adjustments
            
            const deltaValue = (deltaY / fullRangePx) * range * sensitivity;
            
            let newValue = startValueRef.current + deltaValue;
            newValue = Math.min(Math.max(newValue, min), max);
            
            // Snap to center
            if (centerZero) {
                const center = (min + max) / 2;
                // Snap window is 5% of range
                if (Math.abs(newValue - center) < range * 0.05 && !e.shiftKey) {
                    newValue = center;
                }
            }

            onChange(newValue);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            // Unlock the UI
            document.body.classList.remove('dragging-vertical');
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove, { capture: true });
            window.addEventListener('mouseup', handleMouseUp, { capture: true });
        }
        return () => {
            // Safety cleanup
            window.removeEventListener('mousemove', handleMouseMove, { capture: true });
            window.removeEventListener('mouseup', handleMouseUp, { capture: true });
            document.body.classList.remove('dragging-vertical');
        };
    }, [isDragging, min, max, onChange, centerZero]);

    return (
        <div 
            className="flex flex-col items-center gap-1"
            onMouseEnter={tooltipHandlers.onMouseEnter}
            onMouseLeave={tooltipHandlers.onMouseLeave}
            onMouseMove={tooltipHandlers.onMouseMove}
        >
            <div 
                className="relative rounded-full group touch-none"
                style={{ width: pxSize, height: pxSize, cursor: isDragging ? 'ns-resize' : 'ns-resize' }}
                onMouseDown={handleMouseDown}
                onContextMenu={handleContextMenu}
                onDoubleClick={handleDoubleClick}
            >
                {/* SVG Knob */}
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible pointer-events-none">
                    <defs>
                        <linearGradient id="knobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#333" />
                            <stop offset="100%" stopColor="#111" />
                        </linearGradient>
                        <filter id={`glow-${label}`}>
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    
                    {/* Background Ring */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#222" strokeWidth="8" strokeLinecap="round" strokeDasharray="210" strokeDashoffset="-45" transform="rotate(135 50 50)" />
                    
                    {/* Active Ring */}
                    <path
                        d={describeArc(50, 50, 45, -135, degrees)}
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        filter={`url(#glow-${label})`}
                        opacity={0.8}
                    />

                    {/* Knob Body */}
                    <circle cx="50" cy="50" r="35" fill="url(#knobGrad)" stroke="#444" strokeWidth="1" className="shadow-xl" />
                    
                    {/* Pointer Line */}
                    <g transform={`rotate(${degrees} 50 50)`}>
                        <rect x="48" y="18" width="4" height="15" rx="2" fill={color} filter={`url(#glow-${label})`} />
                    </g>
                </svg>
            </div>
            <span className={`text-[9px] font-mono font-bold tracking-widest text-gray-500 uppercase select-none ${isDragging ? 'text-white' : ''} transition-colors`}>{label}</span>
        </div>
    );
};

// Helper for SVG Arc
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number){
    if (endAngle - startAngle >= 360) endAngle = startAngle + 359.99;
    if (endAngle <= startAngle) return "";

    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    var d = [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
    return d;       
}