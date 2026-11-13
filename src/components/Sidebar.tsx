// src/components/Sidebar.tsx
import { createSignal } from 'solid-js';
import { State, PRESETS } from '../state';
import { resetParticles } from '../engine'; // We might need to trigger a reset
import { Matrix } from './Matrix';

export const Sidebar = () => {
  // Local UI state (doesn't need to be in the global store)
  const [isOpen, setIsOpen] = createSignal(true);

  // Fresh 4x4 matrix with values in [-1, 1], rounded to the matrix's 0.1 step.
  const randomizeMatrix = () => {
    State.attractions = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => Math.round((Math.random() * 2 - 1) * 10) / 10)
    );
    resetParticles();
  };

  // Copy the current settings as JSON, one matrix row per line for readability.
  const copySettings = async () => {
    const rows = State.attractions.map((row) => `    [${row.join(', ')}]`).join(',\n');
    const text = `{\n  "gravity": ${State.forceStrength},\n  "friction": ${State.friction},\n  "matrix": [\n${rows}\n  ]\n}`;
    await navigator.clipboard.writeText(text);
  };

  // Load settings previously copied with the copy button. Throws on anything malformed,
  // so a bad clipboard never half-applies.
  const pasteSettings = async () => {
    const data = JSON.parse(await navigator.clipboard.readText());
    const m = data?.matrix;
    const ok =
      Array.isArray(m) && m.length === 4 &&
      m.every((row: unknown) => Array.isArray(row) && row.length === 4 && row.every((v) => typeof v === 'number' && isFinite(v)));
    if (!ok) throw new Error('Clipboard does not contain a 4x4 matrix');
    const clamp01 = (v: unknown, fallback: number) =>
      typeof v === 'number' && isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
    State.forceStrength = clamp01(data.gravity, State.forceStrength);
    State.friction = clamp01(data.friction, State.friction);
    State.attractions = m.map((row: number[]) => [...row]);
    resetParticles();
  };

  // Toolbar buttons flash green on success or red on failure for a moment.
  type Flash = 'idle' | 'ok' | 'failed';
  const useFlash = () => {
    const [status, setStatus] = createSignal<Flash>('idle');
    let timer: number | undefined;
    const run = async (action: () => void | Promise<void>) => {
      try {
        await action();
        setStatus('ok');
      } catch {
        setStatus('failed');
      }
      clearTimeout(timer);
      timer = window.setTimeout(() => setStatus('idle'), 1500);
    };
    return [status, run] as const;
  };
  const [copyStatus, runCopy] = useFlash();
  const [pasteStatus, runPaste] = useFlash();

  const toolClass = (status: Flash = 'idle') =>
    `flex items-center justify-center py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-all active:scale-95 ${
      status === 'ok' ? 'text-green-400' : status === 'failed' ? 'text-red-400' : 'text-zinc-400 hover:text-cyan-400'
    }`;
  const iconProps = {
    class: 'w-3.5 h-3.5 block',
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.5',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  } as const;
  const okIcon = () => <polyline points="2.5,8.5 6.5,12.5 13.5,4" />;
  const failIcon = () => <path d="M4 4 L12 12 M12 4 L4 12" />;

  return (
    <div class="fixed top-6 right-6 z-50 w-60 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl transition-all duration-500 overflow-hidden">
      
      {/* Header */}
      <div class="flex items-center justify-between px-5 py-4">
        <h1 class="text-lg font-light tracking-widest uppercase text-white select-none">
          Controls
        </h1>
        <button 
          onClick={() => setIsOpen(!isOpen())}
          class="text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        >
          {isOpen() ? '✕' : '☰'}
        </button>
      </div>

      {/* Accordion Content */}
      <div 
        class={`transition-all duration-500 ease-in-out px-5 overflow-hidden ${
          isOpen() ? 'max-h-[80vh] opacity-100 pb-5' : 'max-h-0 opacity-0'
        }`}
      >
        <div class="flex flex-col gap-5">
          <hr class="border-white/10" />

          {/* Gravity Slider */}
          <div class="flex flex-col gap-2">
            <div class="flex justify-between">
              <label class="text-xs font-bold text-zinc-500 uppercase">Gravity</label>
              <span class="text-xs text-zinc-500">{State.forceStrength.toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.01"
              class="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              value={State.forceStrength}
              onInput={(e) => State.forceStrength = parseFloat(e.currentTarget.value)}
            />
          </div>

          {/* Friction Slider */}
          <div class="flex flex-col gap-2">
            <div class="flex justify-between">
              <label class="text-xs font-bold text-zinc-500 uppercase">Friction</label>
              <span class="text-xs text-zinc-500">{State.friction.toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.01"
              class="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              value={State.friction}
              onInput={(e) => State.friction = parseFloat(e.currentTarget.value)}
            />
          </div>

          <hr class="border-white/10" />

          {/* Presets */}
          <div>
            <p class="text-xs font-bold text-zinc-500 uppercase mb-3">Presets</p>
            <div class="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { State.attractions = PRESETS.default; resetParticles(); }}
                class="bg-zinc-800 hover:bg-zinc-700 text-sm py-2 rounded border border-white/5 text-zinc-300 transition-colors"
              >
                Default
              </button>
              <button 
                onClick={() => { State.attractions = PRESETS.worms; resetParticles(); }}
                class="bg-zinc-800 hover:bg-zinc-700 text-sm py-2 rounded border border-white/5 text-zinc-300 transition-colors"
              >
                Worms
              </button>
              <button 
                onClick={() => { State.attractions = PRESETS.cells; resetParticles(); }}
                class="bg-zinc-800 hover:bg-zinc-700 text-sm py-2 rounded border border-white/5 text-zinc-300 transition-colors"
              >
                Cells
              </button>

              <button 
                onClick={() => { State.attractions = PRESETS.fireworks; resetParticles(); }}
                class="bg-zinc-800 hover:bg-zinc-700 text-sm py-2 rounded border border-white/5 text-zinc-300 transition-colors"
              >
                Fireworks
              </button>
            </div>
          </div>

          <hr class="border-white/10" />

          {/* Matrix Component */}
          <div>
            <p class="text-xs font-bold text-zinc-500 uppercase mb-2">Attraction Matrix</p>

            {/* Toolbar: styled like a one-row matrix, so buttons line up with its cells */}
            <div class="grid grid-cols-4 gap-1 p-2 mb-2 bg-white/5 rounded-lg border border-white/10">
              <button
                onClick={() => runCopy(copySettings)}
                title={copyStatus() === 'ok' ? 'Copied!' : copyStatus() === 'failed' ? 'Copy failed' : 'Copy gravity, friction and matrix'}
                aria-label="Copy settings"
                class={toolClass(copyStatus())}
              >
                <svg {...iconProps}>
                  {copyStatus() === 'ok' ? okIcon() : copyStatus() === 'failed' ? failIcon() : (
                    <>
                      <rect x="5.25" y="5.25" width="9" height="9" rx="2" />
                      <path d="M10.75 5.25 V3.75 A2 2 0 0 0 8.75 1.75 H3.75 A2 2 0 0 0 1.75 3.75 V8.75 A2 2 0 0 0 3.75 10.75 H5.25" />
                    </>
                  )}
                </svg>
              </button>

              <button
                onClick={() => runPaste(pasteSettings)}
                title={pasteStatus() === 'ok' ? 'Pasted!' : pasteStatus() === 'failed' ? 'Clipboard has no valid settings' : 'Paste copied settings'}
                aria-label="Paste settings"
                class={toolClass(pasteStatus())}
              >
                <svg {...iconProps}>
                  {pasteStatus() === 'ok' ? okIcon() : pasteStatus() === 'failed' ? failIcon() : (
                    <>
                      <rect x="2.75" y="2.75" width="10.5" height="11.5" rx="2" />
                      <rect x="5.5" y="1.5" width="5" height="2.75" rx="1" fill="currentColor" stroke="none" />
                      <path d="M5.5 8 H10.5 M5.5 10.75 H9" />
                    </>
                  )}
                </svg>
              </button>

              <button
                onClick={randomizeMatrix}
                title="Randomize matrix"
                aria-label="Randomize matrix"
                class={`${toolClass()} active:rotate-90`}
              >
                <svg {...iconProps}>
                  <rect x="1.75" y="1.75" width="12.5" height="12.5" rx="2.5" />
                  <g fill="currentColor" stroke="none">
                    <circle cx="5" cy="5" r="1.2" />
                    <circle cx="11" cy="5" r="1.2" />
                    <circle cx="8" cy="8" r="1.2" />
                    <circle cx="5" cy="11" r="1.2" />
                    <circle cx="11" cy="11" r="1.2" />
                  </g>
                </svg>
              </button>

              <button
                onClick={resetParticles}
                title="Restart particles with current settings"
                aria-label="Restart particles"
                class={`${toolClass()} active:-rotate-90`}
              >
                <svg {...iconProps}>
                  <path d="M13.5 8 A5.5 5.5 0 1 1 11.9 4.1" />
                  <polyline points="12.25,1.5 12.25,4.5 9.25,4.5" />
                </svg>
              </button>
            </div>

            <Matrix />
          </div>

        </div>
      </div>
    </div>
  );
};