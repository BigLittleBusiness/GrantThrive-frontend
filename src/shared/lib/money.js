/** Format AUD cents as whole dollars, e.g. 500000 -> "$5,000". */
export function formatAud(cents) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(cents / 100);
}
