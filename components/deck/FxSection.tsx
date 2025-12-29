import React from 'react';
import { Knob } from '../Knob';
import { TooltipWrapper } from '../TooltipWrapper';
import { GATE_PRESETS } from '../../constants';

interface FxSectionProps {
    // FX
    fxDist: number; setFxDist: (v: number) => void;
    fxDelayAmt: number; setFxDelayAmt: (v: number) => void;
    fxDelayTime: number; setFxDelayTime: (v: number) => void;
    setDistortion: (v: number) => void;
    setDelay: (wet: number, time: number) => void;

    // Gate
    gateRate: number; setGateRate: (v: number) => void;
    gateMix: number; setGateMix: (v: number) => void;
    gatePattern: number[];
    gatePresetName: string; 
    loadGatePreset: (name: string) => void;
    toggleGateStep: (index: number) => void;
}

export const FxSection: React.FC<FxSectionProps> = ({
    fxDist, setFxDist, fxDelayAmt, setFxDelayAmt, fxDelayTime, setFxDelayTime,
    setDistortion, setDelay,
    gateRate, setGateRate, gateMix, setGateMix, gatePattern, gatePresetName,
    loadGatePreset, toggleGateStep
}) => {
    return (
        <div className="flex gap-2 h-32 shrink-0">
            <div className="w-1/3 bg-black/30 rounded border border-white/5 flex flex-col justify-between p-2 relative overflow-hidden">
                <div className="text-[8px] bg-white/5 px-1 text-gray-400 rounded w-max mb-1">FX ENGINE</div>
                <div className="flex justify-around items-center flex-1">
                    <Knob 
                        label="DRIVE" min={0} max={1} value={fxDist} onChange={(v) => { setFxDist(v); setDistortion(v); }} color="#ef4444" size="xs" defaultValue={0} 
                        tooltipTitle="OVERDRIVE" tooltipDesc="Adds harmonic distortion and saturation."
                        doubleClickToReset={true}
                    />
                    <Knob 
                        label="ECHO" min={0} max={1} value={fxDelayAmt} onChange={(v) => { setFxDelayAmt(v); setDelay(v, fxDelayTime); }} color="#3b82f6" size="xs" defaultValue={0} 
                        tooltipTitle="DELAY FEEDBACK" tooltipDesc="Controls amount of echo."
                        doubleClickToReset={true}
                    />
                    <Knob 
                        label="TIME" min={0.01} max={1} value={fxDelayTime} onChange={(v) => { setFxDelayTime(v); setDelay(fxDelayAmt, v); }} color="#3b82f6" size="xs" defaultValue={0.33} 
                        tooltipTitle="DELAY TIME" tooltipDesc="Sets echo interval."
                    />
                </div>
            </div>

            <div className="flex-1 bg-black/30 rounded border border-white/5 flex flex-col p-2 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                    <div className="text-[8px] bg-purple-500/20 text-purple-300 px-1 rounded border border-purple-500/30">TRANCE GATE // {gatePresetName}</div>
                    <div className="flex gap-1">
                        <select 
                            className="bg-black text-[9px] text-gray-400 border border-gray-700 rounded outline-none w-16"
                            onChange={(e) => setGateRate(Number(e.target.value))}
                            value={gateRate}
                        >
                            <option value={8}>1/8</option>
                            <option value={16}>1/16</option>
                            <option value={32}>1/32</option>
                        </select>
                        <select 
                            className="bg-black text-[9px] text-gray-400 border border-gray-700 rounded outline-none w-20"
                            onChange={(e) => loadGatePreset(e.target.value)}
                            value={gatePresetName === 'CUSTOM' ? '' : gatePresetName}
                        >
                            <option value="" disabled>PRESET</option>
                            {GATE_PRESETS.map(p => (
                                <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    </div>

                    <div className="flex flex-1 gap-2 items-center">
                    <div className="shrink-0 border-r border-white/10 pr-2">
                        <Knob 
                            label="GATE MIX" min={0} max={1} value={gateMix} onChange={setGateMix} color="#a855f7" size="sm" defaultValue={0} 
                            tooltipTitle="GATE DEPTH" tooltipDesc="Controls gating intensity."
                            doubleClickToReset={true}
                        />
                    </div>

                    <div className="flex-1 grid grid-cols-8 gap-[2px] h-full">
                        {gatePattern.map((step, i) => (
                            <TooltipWrapper key={i} title={`STEP ${i+1}`} desc="Toggle rhythm step.">
                                <button
                                    onMouseDown={() => toggleGateStep(i)}
                                    className={`rounded-sm transition-all duration-75 relative overflow-hidden ${step ? 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'bg-gray-800/50 hover:bg-gray-700'}`}
                                >
                                    {i % 4 === 0 && <div className="absolute top-0 right-0 w-1 h-1 bg-white/50"></div>}
                                </button>
                            </TooltipWrapper>
                        ))}
                    </div>
                    </div>
            </div>
        </div>
    );
};