// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getString(val: any, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && val.length > 0) return typeof val[0] === 'string' ? val[0] : fallback;
  return fallback;
}
