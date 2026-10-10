import type { ShipMode } from "./types";
import type { Species } from "../types";
export function heatingOrder(generatorSpecies:Species|null,mode:ShipMode):("furnace"|"electric-heater")[] {
  return mode==='Masking'?['electric-heater']:generatorSpecies==='diesel'?['furnace','electric-heater']:['electric-heater','furnace'];
}
