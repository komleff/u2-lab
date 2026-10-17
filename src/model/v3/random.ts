import type {StateV3} from './types';
// Frozen xorshift32/1: draw advances only on an actual failure/restart check.
export function randomV3(rng:StateV3['rng']):number{
  let x=rng.state;x^=x<<13;x^=x>>>17;x^=x<<5;rng.state=x>>>0;
  return rng.state/4294967296;
}
