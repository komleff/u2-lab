export function finite(value: number, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  return value;
}

export function nonnegative(value: number, name: string): number {
  if (finite(value, name) < 0) throw new RangeError(`${name} must be nonnegative`);
  return value;
}

export function positive(value: number, name: string): number {
  if (finite(value, name) <= 0) throw new RangeError(`${name} must be positive`);
  return value;
}

export function fraction(value: number, name: string): number {
  if (nonnegative(value, name) > 1) throw new RangeError(`${name} must be at most one`);
  return value;
}

export function flag(value: boolean, name: string): boolean {
  if (typeof value !== "boolean") throw new TypeError(`${name} must be boolean`);
  return value;
}

export function label(value: string, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) throw new TypeError(`${name} must be nonempty`);
  return value;
}

export function strongestTransmission(values: readonly number[]): number {
  if (!Array.isArray(values)) throw new TypeError("transmissions must be an array");
  return values.reduce((strongest, value) => Math.min(strongest, fraction(value, "transmission")), 1);
}

// Cardinal значения задаются точно: cos(π/2) в JS иначе оставляет ложный ненулевой источник.
export function normalizeDegrees(degrees: number): number {
  const wrapped = finite(degrees, "degrees") % 360;
  const normalized = wrapped < 0 ? wrapped + 360 : wrapped;
  return normalized === 360 || normalized === 0 ? 0 : normalized;
}

export function cosineDegrees(degrees: number): number {
  const angle = normalizeDegrees(degrees);
  if (angle === 0) return 1;
  if (angle === 180) return -1;
  if (angle === 90 || angle === 270) return 0;
  return Math.cos(angle * Math.PI / 180);
}

export function sineDegrees(degrees: number): number {
  return cosineDegrees(90 - normalizeDegrees(degrees));
}
