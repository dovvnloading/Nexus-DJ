import React from 'react';
import { useTooltip } from '../hooks/useTooltip';

interface TooltipWrapperProps {
    title: string;
    desc: string;
    children: React.ReactElement;
    className?: string;
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ title, desc, children, className }) => {
    const handlers = useTooltip(title, desc);
    
    // Merge handlers with existing children handlers if necessary, 
    // but typically the wrapper div handles the events for simplicity.
    
    return (
        <div 
            {...handlers} 
            className={`contents ${className || ''}`} // contents display avoids breaking flex layouts
        >
            {children}
        </div>
    );
};