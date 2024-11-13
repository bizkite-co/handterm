const matchers = require('@testing-library/jest-dom/matchers');
const expect = require('expect');

Object.keys(matchers)
  .filter(key => key !== 'default')
  .forEach(key => {
    expect.extend({
      [key]: matchers[key]
    });
  });
