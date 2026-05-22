import { moonSignOrder, type MoonSignName } from './data/moonSignProfiles';

export type MoonSignWindow = {
  sign: MoonSignName;
  startsAt: Date;
  endsAt: Date;
};

export type MoonSignDashboard = {
  current: MoonSignWindow;
  next: MoonSignWindow;
  monthlyIngresses: MoonSignWindow[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function julianDaysSinceJ2000(date: Date) {
  return date.getTime() / DAY_MS - 10957.5;
}

export function getMoonEclipticLongitude(date: Date) {
  const days = julianDaysSinceJ2000(date);
  const meanLongitude = normalizeDegrees(218.316 + 13.176396 * days);
  const moonAnomaly = normalizeDegrees(134.963 + 13.064993 * days);
  const sunAnomaly = normalizeDegrees(357.529 + 0.98560028 * days);
  const elongation = normalizeDegrees(297.85 + 12.190749 * days);

  return normalizeDegrees(
    meanLongitude +
      6.289 * Math.sin(toRadians(moonAnomaly)) +
      1.274 * Math.sin(toRadians(2 * elongation - moonAnomaly)) +
      0.658 * Math.sin(toRadians(2 * elongation)) +
      0.214 * Math.sin(toRadians(2 * moonAnomaly)) -
      0.186 * Math.sin(toRadians(sunAnomaly))
  );
}

export function getMoonSign(date: Date): MoonSignName {
  const longitude = getMoonEclipticLongitude(date);
  return moonSignOrder[Math.floor(longitude / 30) % 12];
}

function findBoundary(startMs: number, endMs: number, expectedSign: MoonSignName) {
  let low = startMs;
  let high = endMs;

  for (let i = 0; i < 36; i += 1) {
    const mid = (low + high) / 2;
    if (getMoonSign(new Date(mid)) === expectedSign) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return new Date(high);
}

function findPreviousIngress(date: Date) {
  const sign = getMoonSign(date);
  let cursor = date.getTime();
  let previous = cursor;

  for (let i = 0; i < 120; i += 1) {
    previous = cursor - HOUR_MS;
    if (getMoonSign(new Date(previous)) !== sign) {
      return findBoundary(previous, cursor, getMoonSign(new Date(previous)));
    }
    cursor = previous;
  }

  return new Date(date.getTime() - 2.5 * DAY_MS);
}

function findNextIngress(date: Date) {
  const sign = getMoonSign(date);
  let cursor = date.getTime();
  let next = cursor;

  for (let i = 0; i < 120; i += 1) {
    next = cursor + HOUR_MS;
    if (getMoonSign(new Date(next)) !== sign) {
      return findBoundary(cursor, next, sign);
    }
    cursor = next;
  }

  return new Date(date.getTime() + 2.5 * DAY_MS);
}

export function getCurrentMoonSignWindow(date = new Date()): MoonSignWindow {
  const startsAt = findPreviousIngress(date);
  const endsAt = findNextIngress(date);

  return {
    sign: getMoonSign(date),
    startsAt,
    endsAt,
  };
}

export function getMoonSignDashboard(date = new Date()): MoonSignDashboard {
  const current = getCurrentMoonSignWindow(date);
  const nextStartsAt = current.endsAt;
  const nextSign = getMoonSign(new Date(nextStartsAt.getTime() + 1000));
  const nextEndsAt = findNextIngress(new Date(nextStartsAt.getTime() + HOUR_MS));
  const next = {
    sign: nextSign,
    startsAt: nextStartsAt,
    endsAt: nextEndsAt,
  };

  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const monthlyIngresses: MoonSignWindow[] = [];
  let cursor = new Date(monthStart);
  let guard = 0;

  while (cursor < monthEnd && guard < 20) {
    const ingress = findNextIngress(cursor);
    if (ingress >= monthEnd) break;
    const sign = getMoonSign(new Date(ingress.getTime() + 1000));
    const endsAt = findNextIngress(new Date(ingress.getTime() + HOUR_MS));
    monthlyIngresses.push({ sign, startsAt: ingress, endsAt });
    cursor = new Date(ingress.getTime() + HOUR_MS);
    guard += 1;
  }

  return { current, next, monthlyIngresses };
}

export function getPrepWindowStart(ingress: Date) {
  return new Date(ingress.getTime() - 2 * DAY_MS);
}
