/**
 * BDT currency formatter
 * @param {number} amount
 * @returns {string} formatted string like ৳ 5,000
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '৳ 0';
  return '৳ ' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format with decimals
 */
export function formatCurrencyDecimal(amount) {
  if (amount === null || amount === undefined) return '৳ 0.00';
  return '৳ ' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
