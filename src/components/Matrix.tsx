// src/components/Matrix.tsx
import { For } from 'solid-js';
import { State } from '../state';

const STEP = 0.1;
// Pixels of trackpad scroll per step; a mouse wheel notch always counts as one step.
const WHEEL_THRESHOLD = 50;

export const Matrix = () => {
  // Accumulates small trackpad deltas so a gentle swipe doesn't fly through values.
  let wheelAccum = 0;

  const onWheel = (e: WheelEvent, i: number, j: number) => {
    // Keep the sidebar/page from scrolling while adjusting a value.
    e.preventDefault();

    const delta = e.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? e.deltaY : e.deltaY * WHEEL_THRESHOLD;
    // Reset when the scroll direction flips.
    if (Math.sign(delta) !== Math.sign(wheelAccum)) wheelAccum = 0;
    wheelAccum += delta;
    if (Math.abs(wheelAccum) < WHEEL_THRESHOLD) return;

    // Scroll up increases, scroll down decreases; at most one step per event.
    const dir = wheelAccum < 0 ? 1 : -1;
    wheelAccum = 0;
    const next = State.attractions[i][j] + dir * STEP;
    // Round to avoid floating-point drift like 0.30000000000000004.
    State.attractions[i][j] = Math.round(next * 10) / 10;
  };

  return (
    <div class="grid grid-cols-4 gap-1 p-2 bg-white/5 rounded-lg border border-white/10">
      {/* Solid's <For> is like a map(), but highly optimized.
         It only updates the specific cell that changes.
      */}
      <For each={State.attractions}>
        {(row, i) => (
          <For each={row}>
            {(val, j) => (
              <input
                type="number"
                step="0.1"
                title="Scroll to adjust"
                // Hide the native up/down spinner arrows (Chrome/Safari and Firefox).
                class="w-full bg-zinc-800 text-white text-xs py-1.5 rounded text-center cursor-ns-resize focus:outline-none focus:ring-1 focus:ring-cyan-500 hover:bg-zinc-700 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

                // 1. READ value from store
                value={val}

                // 2. WRITE value back to store on change
                onInput={(e) => {
                  const num = parseFloat(e.currentTarget.value);
                  // Direct mutation! Solid handles the reactivity.
                  State.attractions[i()][j()] = isNaN(num) ? 0 : num;
                }}

                // 3. Mouse wheel / trackpad scroll while hovering adjusts the value
                onWheel={(e) => onWheel(e, i(), j())}
              />
            )}
          </For>
        )}
      </For>
    </div>
  );
};
