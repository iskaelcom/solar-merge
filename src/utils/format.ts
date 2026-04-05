export function formatCompactNumber(n: number): string {
  if (n >= 1000000000000) {
    const t = Math.floor((n / 1000000000000) * 10) / 10;
    return (t % 1 === 0 ? t.toFixed(0) : t.toFixed(1)) + 'T';
  }
  if (n >= 1000000000) {
    const b = Math.floor((n / 1000000000) * 10) / 10;
    return (b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)) + 'B';
  }
  if (n >= 1000000) {
    const m = Math.floor((n / 1000000) * 10) / 10;
    return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
  }
  if (n >= 1000) {
    const k = Math.floor((n / 1000) * 10) / 10;
    return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'K';
  }
  return n.toLocaleString();
}
