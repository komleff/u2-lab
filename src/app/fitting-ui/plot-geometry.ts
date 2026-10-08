// Общая область обзора оставляет место слева для температурных чисел/порогов.
export const PLOT = { left: 180, right: 660, top: 20, bottom: 170, width: 480, viewBox: "0 0 700 205" } as const;
export const plotX = (timeS: number, horizonS: number) => PLOT.left + timeS / horizonS * PLOT.width;
