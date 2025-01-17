// eslint-disable-next-line @typescript-eslint/no-var-requires
const preferNullishCoalescing = require('./prefer-nullish-coalescing.cjs');

module.exports = {
  rules: {
    'prefer-nullish-coalescing': preferNullishCoalescing,
    'no-button-element': require('./no-button-element.cjs'),

  }
};
