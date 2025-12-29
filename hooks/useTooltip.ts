import React, { useRef, useCallback } from 'react';
import { useTooltipContext } from '../context/TooltipContext';

export const useTooltip = (title?: string, description?: string) => {
    const { showTooltip, hideTooltip } = useTooltipContext();
    const timerRef = useRef<number | null>(null);
    const mousePosRef = useRef({ x: 0, y: 0 });

    const handleMouseEnter = useCallback((e: React.MouseEvent) => {
        if (!title || !description) return;
        
        mousePosRef.current = { x: e.clientX, y: e.clientY };
        
        if (timerRef.current) clearTimeout(timerRef.current);

        // Reduced delay to 0.8s for better UX with the new face
        timerRef.current = window.setTimeout(() => {
            showTooltip(title, description, mousePosRef.current.x, mousePosRef.current.y);
        }, 800); 
    }, [title, description, showTooltip]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        mousePosRef.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        hideTooltip();
    }, [hideTooltip]);

    const handleMouseDown = useCallback(() => {
         if (timerRef.current) clearTimeout(timerRef.current);
         hideTooltip();
    }, [hideTooltip]);

    if (!title || !description) return {};

    return {
        onMouseEnter: handleMouseEnter,
        onMouseMove: handleMouseMove,
        onMouseLeave: handleMouseLeave,
        onMouseDown: handleMouseDown
    };
};