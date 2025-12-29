import React from 'react';
import { Knob } from '../Knob';

interface MixerStripProps {
    color: string;
    gain: number; setGain: (v: number) => void;
    eqHi: number; setEqHi: (v: number) => void;
    eqMid: number; setEqMid: (v: number) => void;
    eqLow: number; setEqLow: (v: number) => void;
    fxNoise: number; setFxNoise: (v: number) => void;
    fxFlange: number; setFxFlange: (v: number) => void;
    filterVal: number; setFilterVal: (v: number) => void;
    panVal: number; setPanVal: (v: number) => void;
    
    // Audio Update Callbacks
    updateGain: (v: number) => void;
    setEq: (type: 'low' | 'mid' | 'high', val: number) => void;
    setNoise: (v: number) => void;
    setFlange: (v: number) => void;
    setOneKnobFilter: (v: number) => void;
    setPan: (v: number) => void;
}

export const MixerStrip: React.FC<MixerStripProps> = ({
    color,
    gain, setGain, updateGain,
    eqHi, setEqHi, eqMid, setEqMid, eqLow, setEqLow, setEq,
    fxNoise, setFxNoise, setNoise,
    fxFlange, setFxFlange, setFlange,
    filterVal, setFilterVal, setOneKnobFilter,
    panVal, setPanVal, setPan
}) => {
    return (
        <div className="w-20 flex flex-col items-center bg-[#0d0d0f] border border-white/5 rounded py-2 gap-3 shadow-inner">
            <div className="flex flex-col gap-2 items-center w-full pb-2 border-b border-white/5">
                <Knob 
                    label="TRIM" min={0} max={1.5} value={gain} onChange={(v) => { setGain(v); updateGain(v); }} color="#fff" size="sm" defaultValue={1} 
                    tooltipTitle="INPUT TRIM" tooltipDesc="Adjusts pre-fader gain."
                />
            </div>
            
            <div className="flex flex-col gap-1 items-center w-full">
                <Knob 
                    label="HI" min={-12} max={12} value={eqHi} onChange={(v) => { setEqHi(v); setEq('high', v); }} color="#999" size="sm" centerZero defaultValue={0} 
                    tooltipTitle="HIGH EQ" tooltipDesc="High frequency adjust."
                />
                <Knob 
                    label="MID" min={-12} max={12} value={eqMid} onChange={(v) => { setEqMid(v); setEq('mid', v); }} color="#999" size="sm" centerZero defaultValue={0} 
                    tooltipTitle="MID EQ" tooltipDesc="Mid frequency adjust."
                />
                <Knob 
                    label="LOW" min={-12} max={12} value={eqLow} onChange={(v) => { setEqLow(v); setEq('low', v); }} color="#999" size="sm" centerZero defaultValue={0} 
                    tooltipTitle="LOW EQ" tooltipDesc="Bass frequency adjust."
                />
            </div>

            <div className="grid grid-cols-2 gap-1 w-full px-1 py-1 mt-1 border-y border-white/5 bg-white/5">
                <Knob 
                    label="NOISE" min={0} max={1} value={fxNoise} onChange={(v) => { setFxNoise(v); setNoise(v); }} size="xs" color="#9ca3af" 
                    tooltipTitle="NOISE GEN" tooltipDesc="White noise generator."
                    doubleClickToReset={true}
                />
                <Knob 
                    label="FLANGE" min={0} max={1} value={fxFlange} onChange={(v) => { setFxFlange(v); setFlange(v); }} size="xs" color="#8b5cf6" 
                    tooltipTitle="FLANGER" tooltipDesc="Jet sweep effect."
                    doubleClickToReset={true}
                />
            </div>
            
            <div className="flex flex-col gap-2 items-center w-full pt-2 bg-gray-900/50 rounded-b pb-2 flex-1 justify-end">
                    <Knob 
                    label="FILTER" 
                    min={0} max={1} 
                    value={filterVal} 
                    onChange={(v) => { setFilterVal(v); setOneKnobFilter(v); }} 
                    color={color} 
                    size="md"
                    centerZero 
                    defaultValue={0.5}
                    tooltipTitle="COLOR FILTER" tooltipDesc="LPF / HPF Combo."
                />
                <div className="w-full border-t border-white/5 my-1"></div>
                <Knob 
                    label="PAN" 
                    min={-1} max={1} 
                    value={panVal} 
                    onChange={(v) => { setPanVal(v); setPan(v); }} 
                    color="#eab308" 
                    size="sm" 
                    centerZero 
                    defaultValue={0}
                    tooltipTitle="PANNING" tooltipDesc="Stereo balance."
                />
            </div>
        </div>
    );
};