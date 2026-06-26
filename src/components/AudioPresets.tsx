import React from 'react';
import { EqualizerPreset } from '../types';
import { Sliders, Check } from 'lucide-react';

interface AudioPresetsProps {
  currentPreset: EqualizerPreset;
  onPresetChange: (preset: EqualizerPreset) => void;
}

interface PresetDetail {
  id: EqualizerPreset;
  name: string;
  description: string;
  bars: number[]; // relative frequency visualization values
}

export default function AudioPresets({ currentPreset, onPresetChange }: AudioPresetsProps) {
  const PRESETS: PresetDetail[] = [
    {
      id: 'flat',
      name: 'Padrão (Flat)',
      description: 'Som limpo e balanceado original da gravação.',
      bars: [4, 4, 4, 4, 4, 4, 4, 4]
    },
    {
      id: 'bass',
      name: 'Super Bass',
      description: 'Graves amplificados para batidas marcantes e profundidade.',
      bars: [9, 8, 7, 5, 4, 3, 3, 4]
    },
    {
      id: 'vocal',
      name: 'Acento Vocal',
      description: 'Vozes nítidas e claras com destaque em médios.',
      bars: [3, 4, 5, 8, 9, 7, 4, 3]
    },
    {
      id: 'classic',
      name: 'Sala de Concerto',
      description: 'Reverberação suave otimizada para instrumentos acústicos.',
      bars: [5, 6, 7, 6, 5, 6, 7, 6]
    },
    {
      id: 'chill',
      name: 'Chill & Relax',
      description: 'Frequências agudas atenuadas para audição relaxante.',
      bars: [5, 5, 4, 4, 3, 3, 2, 2]
    }
  ];

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 shadow-lg backdrop-blur-md" id="presets-container">
      <div className="flex items-center gap-2 mb-3">
        <Sliders className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide">Efeitos & Equalizador</h3>
      </div>

      <div className="space-y-2">
        {PRESETS.map((preset) => {
          const isActive = currentPreset === preset.id;
          return (
            <button
              key={preset.id}
              id={`btn-preset-${preset.id}`}
              onClick={() => onPresetChange(preset.id)}
              className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                isActive
                  ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-100 shadow-md shadow-indigo-950/20'
                  : 'bg-slate-950/20 border-slate-800/40 hover:bg-slate-800/20 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-100">
                  {preset.name}
                  {isActive && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-medium">
                  {preset.description}
                </p>
              </div>

              {/* Mini Equalizer Preset Visual Bar */}
              <div className="flex items-end gap-[2px] h-6 w-12 shrink-0 justify-end">
                {preset.bars.map((height, idx) => (
                  <span
                    key={idx}
                    style={{ height: `${height * 10}%` }}
                    className={`w-[3px] rounded-t-sm transition-all duration-300 ${
                      isActive ? 'bg-gradient-to-t from-indigo-500 to-purple-400' : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
