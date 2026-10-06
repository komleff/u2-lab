/** Закон импульса U2 в одном измерении; топливо и энергию считает общий kernel. */
export const FLIGHT_C = 3000;
export type FlightState = { positionM: number; velocityMS: number };
export function momentum(velocityMS: number, massKg: number): number {
  if (!Number.isFinite(massKg) || massKg<=0 || !Number.isFinite(velocityMS) || Math.abs(velocityMS)>=FLIGHT_C)
    throw Error("Неверная масса/скорость релятивистского участка");
  return massKg*velocityMS/Math.sqrt(1-(velocityMS/FLIGHT_C)**2);
}
export function stoppingDistance(velocityMS:number,massKg:number,retroForceN:number):number {
  const p=momentum(velocityMS,massKg);
  if (!(Number.isFinite(retroForceN)&&retroForceN>0))throw Error("Нет положительной тормозной тяги");
  // Рациональная форма γ−1 сохраняет точность при малой скорости.
  const q=p/(massKg*FLIGHT_C),gamma=Math.hypot(1,q);
  return massKg*FLIGHT_C*FLIGHT_C/retroForceN*q*q/(gamma+1);
}
export function advanceFlight(input:FlightState,massKg:number,forceN:number,dt:number):FlightState {
  const p0=momentum(input.velocityMS,massKg);
  if (!Number.isFinite(input.positionM)||!Number.isFinite(forceN)||!Number.isFinite(dt)||dt<0)
    throw Error("Неверные SI условия шага полёта");
  if(forceN===0)return {positionM:input.positionM+input.velocityMS*dt,velocityMS:input.velocityMS};
  const p1=p0+forceN*dt,base=massKg*FLIGHT_C;
  const e0=Math.hypot(base,p0),e1=Math.hypot(base,p1);
  // Факторизация интеграла v·dp/F сохраняет точность без вычитания близких энергий.
  const distance=FLIGHT_C*(p1+p0)*dt/(e1+e0);
  return {positionM:input.positionM+distance,velocityMS:FLIGHT_C*p1/e1};
}
