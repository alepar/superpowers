export function formatAmount(cents) { return '$' + (cents < 0 ? '-' : '') + Math.trunc(Math.abs(cents) / 100) + '.' + String(Math.abs(cents % 100)).padStart(2, '0'); }
