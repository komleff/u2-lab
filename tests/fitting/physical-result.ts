import type { RunResultV2 } from '../../src/runner/run';

// Новая диагностика меняет только события и их счётчики; всё остальное остаётся golden.
export function physicalResult(r:RunResultV2) {
 const {events,retention,...unchanged}=r;
 const {totalEvents,droppedEvents,...numericRetention}=retention;
 return {...unchanged,retention:numericRetention};
}
