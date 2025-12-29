import React, { useEffect, useRef } from 'react';

interface OscilloscopePetProps {
    className?: string;
    alwaysExcited?: boolean;
    disableInteraction?: boolean;
}

export const OscilloscopePet: React.FC<OscilloscopePetProps> = ({ className, alwaysExcited = false, disableInteraction = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Interaction State Refs (No re-renders needed for physics/anim)
  const isHoveringRef = useRef(alwaysExcited);
  const posRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 }); // Physics position offset
  const animRef = useRef({ 
      active: false, 
      type: 0, 
      frame: 0,
      duration: 0 
  });

  // Sync prop
  useEffect(() => {
      if (alwaysExcited) isHoveringRef.current = true;
  }, [alwaysExcited]);

  const triggerAnimation = () => {
      if (animRef.current.active) return;
      const type = Math.floor(Math.random() * 6);
      let duration = 60; // default frames
      if (type === 1) duration = 30; // quick squash
      if (type === 4) duration = 20; // fast glitch
      
      animRef.current = {
          active: true,
          type: type,
          frame: 0,
          duration: duration
      };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let blinkTimer = 0;
    let isBlinking = false;
    let animationId: number;
    
    // Character Physics
    let currentRadius = 60;
    
    // Noise/Vibration
    const noise = new Float32Array(100);

    const resize = () => {
      if (container) {
        const dpr = window.devicePixelRatio || 1;
        if (container.clientWidth === 0 || container.clientHeight === 0) return;
        
        canvas.width = container.clientWidth * dpr;
        canvas.height = container.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${container.clientWidth}px`;
        canvas.style.height = `${container.clientHeight}px`;
      }
    };
    
    // Robust sizing observation to fix modal clipping issues
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    const drawCurve = (points: {x: number, y: number}[], close: boolean = false) => {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        if (close) {
             const last = points[points.length - 1];
             const first = points[0];
             const xc = (last.x + first.x) / 2;
             const yc = (last.y + first.y) / 2;
             ctx.quadraticCurveTo(last.x, last.y, xc, yc);
             ctx.quadraticCurveTo(xc, yc, first.x, first.y);
        } else {
             const last = points[points.length-1];
             ctx.lineTo(last.x, last.y);
        }
        ctx.stroke();
    };

    const render = () => {
        if (!canvasRef.current || !containerRef.current) return;
        frame++;
        
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        let targetX = 0;
        let targetY = 0;
        
        // --- PHYSICS: Avoid Cursor ---
        if (!disableInteraction) {
            // Mouse relative to container
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;
            
            // Vector from Mouse to Center (Direction to flee)
            const dx = centerX - mx;
            const dy = centerY - my;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const avoidThreshold = 150; // Detection range
            
            // If mouse is near center, push face away
            if (dist < avoidThreshold && dist > 0) {
                 const pushForce = (avoidThreshold - dist) / avoidThreshold; // 0 to 1
                 const angle = Math.atan2(dy, dx); // Angle away from mouse
                 const moveDist = pushForce * 100; // Max move pixels
                 targetX = Math.cos(angle) * moveDist;
                 targetY = Math.sin(angle) * moveDist;
            }
        }

        // Spring physics for smooth movement
        const k = 0.08; // Spring stiffness
        const damp = 0.85; // Damping
        
        const ax = (targetX - posRef.current.x) * k;
        const ay = (targetY - posRef.current.y) * k;
        
        posRef.current.vx += ax;
        posRef.current.vy += ay;
        posRef.current.vx *= damp;
        posRef.current.vy *= damp;
        
        posRef.current.x += posRef.current.vx;
        posRef.current.y += posRef.current.vy;

        // Final draw coordinates
        let cx = centerX + posRef.current.x;
        let cy = centerY + posRef.current.y;

        // Dynamic scaling
        const scale = Math.min(width, height) / 200;

        ctx.clearRect(0, 0, width, height);
        ctx.save(); // Save state for animations

        // --- ANIMATIONS ---
        if (animRef.current.active) {
            animRef.current.frame++;
            const t = animRef.current.frame / animRef.current.duration;
            const animType = animRef.current.type;

            // Pivot around face center
            ctx.translate(cx, cy);

            if (animType === 0) { 
                // SPIN
                const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; 
                ctx.rotate(ease * Math.PI * 2);
            } 
            else if (animType === 1) { 
                // SQUASH
                const s = Math.sin(t * Math.PI); 
                ctx.scale(1 + s * 0.4, 1 - s * 0.4);
            }
            else if (animType === 2) { 
                // SHAKE
                const shake = Math.sin(t * 50) * 15 * scale * (1-t);
                ctx.translate(shake, 0);
            }
            else if (animType === 3) { 
                // JUMP
                const jump = Math.sin(t * Math.PI) * 50 * scale;
                ctx.translate(0, -jump);
            }
            else if (animType === 4) { 
                // GLITCH
                if (Math.random() > 0.4) {
                    const gx = (Math.random() - 0.5) * 30 * scale;
                    const gy = (Math.random() - 0.5) * 30 * scale;
                    ctx.translate(gx, gy);
                }
            }
            else if (animType === 5) { 
                // WOBBLE
                const w = Math.sin(t * 25) * 0.3;
                ctx.rotate(w);
                const s = 1 + Math.sin(t * 15) * 0.15;
                ctx.scale(s, s);
            }

            ctx.translate(-cx, -cy);

            if (animRef.current.frame >= animRef.current.duration) {
                animRef.current.active = false;
            }
        }

        // --- BLINK LOGIC ---
        blinkTimer++;
        if (!isBlinking && blinkTimer > 150 + Math.random() * 200) {
            isBlinking = true;
            blinkTimer = 0;
        }
        if (isBlinking && blinkTimer > 10) {
            isBlinking = false;
            blinkTimer = 0;
        }

        const targetRadius = (isHoveringRef.current ? 70 : 60) * scale;
        const baseTarget = isHoveringRef.current ? 70 : 60;
        currentRadius += (baseTarget - currentRadius) * 0.1;

        const breathe = Math.sin(frame * 0.05) * (isHoveringRef.current ? 5 : 2);
        const jitterAmount = isHoveringRef.current ? 3 : 1;
        const r = (currentRadius + breathe) * scale;

        // --- DRAW "OSCY" ---
        ctx.strokeStyle = '#22d3ee'; // Cyan
        ctx.lineWidth = 3 * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 15 * scale;
        ctx.shadowColor = '#22d3ee';

        // 1. Body
        const bodyPoints = [];
        const segments = 12;
        for(let i=0; i<segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const noiseVal = Math.sin(frame * 0.5 + i * 2) * jitterAmount * scale; 
            let radius = r + noiseVal;
            
            // Ears
            if ((i === 10 || i === 11) || (i === 1 || i === 2)) {
                radius += 15 * scale;
            }

            bodyPoints.push({
                x: cx + Math.cos(theta) * radius,
                y: cy + Math.sin(theta) * radius
            });
        }
        bodyPoints.push(bodyPoints[0]);
        drawCurve(bodyPoints, true);

        // 2. Eyes
        let eyeX = 0;
        let eyeY = 0;

        if (!disableInteraction) {
            // Calculate eye look direction based on mouse relative to MOVED face center
            const dxEye = mouseRef.current.x - cx; 
            const dyEye = mouseRef.current.y - cy;
            const distEye = Math.sqrt(dxEye*dxEye + dyEye*dyEye);
            const maxEyeMove = 10 * scale;
            eyeX = (dxEye / Math.max(distEye, 1)) * Math.min(distEye, maxEyeMove);
            eyeY = (dyEye / Math.max(distEye, 1)) * Math.min(distEye, maxEyeMove);
        }
        
        const eyeOffsetX = 20 * scale;
        const eyeOffsetY = 10 * scale;
        const eyeSize = 6 * scale;

        // Left Eye
        ctx.beginPath();
        if (isBlinking) {
            ctx.moveTo(cx - eyeOffsetX + eyeX - eyeSize, cy - eyeOffsetY + eyeY);
            ctx.lineTo(cx - eyeOffsetX + eyeX + eyeSize, cy - eyeOffsetY + eyeY);
        } else {
            ctx.arc(cx - eyeOffsetX + eyeX, cy - eyeOffsetY + eyeY, eyeSize, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Right Eye
        ctx.beginPath();
        if (isBlinking) {
            ctx.moveTo(cx + eyeOffsetX + eyeX - eyeSize, cy - eyeOffsetY + eyeY);
            ctx.lineTo(cx + eyeOffsetX + eyeX + eyeSize, cy - eyeOffsetY + eyeY);
        } else {
             ctx.arc(cx + eyeOffsetX + eyeX, cy - eyeOffsetY + eyeY, eyeSize, 0, Math.PI * 2);
        }
        ctx.stroke();

        // 3. Mouth
        ctx.beginPath();
        const smile = (isHoveringRef.current ? 10 : 5) * scale;
        const mouthY = 15 * scale;
        const mouthX = 10 * scale;
        
        ctx.moveTo(cx - mouthX + eyeX * 0.5, cy + mouthY + eyeY * 0.5);
        ctx.quadraticCurveTo(cx + eyeX * 0.5, cy + mouthY + smile + eyeY * 0.5, cx + mouthX + eyeX * 0.5, cy + mouthY + eyeY * 0.5);
        ctx.stroke();
        
        ctx.shadowBlur = 0;

        // 4. Data Streams
        ctx.fillStyle = "rgba(34, 211, 238, 0.1)";
        ctx.font = `${10 * scale}px monospace`;
        if (frame % 5 === 0) {
             for(let i=0; i<noise.length; i++) noise[i] = Math.random();
        }
        
        for(let i=0; i<6; i++) {
             const x = (width * 0.1) + i * (width * 0.16);
             const y = (frame + i * 50) % height;
             const alpha = 1 - (y/height);
             ctx.fillStyle = `rgba(34, 211, 238, ${alpha * 0.3})`;
             ctx.fillText(`0x${Math.floor(noise[i]*255).toString(16).toUpperCase()}`, x, height - y);
        }

        ctx.restore(); // Restore animation transform

        animationId = requestAnimationFrame(render);
    };

    render();
    
    // Window listener for eyes to follow mouse globally
    const handleWindowMouseMove = (e: MouseEvent) => {
        if (disableInteraction) return;
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseEnter = () => { if (!alwaysExcited && !disableInteraction) isHoveringRef.current = true; };
    const handleMouseLeave = () => { if (!alwaysExcited && !disableInteraction) isHoveringRef.current = false; };
    const handleClick = () => { if (!disableInteraction) triggerAnimation(); };

    if (container) {
        window.addEventListener('mousemove', handleWindowMouseMove);
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);
        container.addEventListener('click', handleClick);
    }
    
    return () => {
         resizeObserver.disconnect();
         window.removeEventListener('mousemove', handleWindowMouseMove);
         cancelAnimationFrame(animationId);
         if (container) {
             container.removeEventListener('mouseenter', handleMouseEnter);
             container.removeEventListener('mouseleave', handleMouseLeave);
             container.removeEventListener('click', handleClick);
         }
    };
  }, [alwaysExcited, disableInteraction]);

  return (
    <div ref={containerRef} className={`w-full h-full relative cursor-crosshair ${className}`}>
        <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};