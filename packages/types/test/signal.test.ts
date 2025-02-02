import { createSignal, isSignal } from '../src/signal';

describe('Signal', () => {
  it('should create a valid signal', () => {
    const signal = createSignal({
      value: 'test',
      name: 'testSignal'
    });

    expect(signal).toBeDefined();
    expect(isSignal(signal)).toBe(true);
    expect(signal.value).toBe('test');
    expect(signal.type).toBe('testSignal');
    expect(signal.key).toBe('testSignal');
    expect(typeof signal.subscribe).toBe('function');
    expect(typeof signal.peek).toBe('function');
  });

  it('should validate signal type', () => {
    const signal = createSignal({
      value: 42,
      name: 'numberSignal'
    });

    expect(isSignal(signal)).toBe(true);
    expect(isSignal({})).toBe(false);
    expect(isSignal(null)).toBe(false);
    expect(isSignal(undefined)).toBe(false);
  });

  it('should maintain type safety', () => {
    const signal = createSignal({
      value: 42,
      name: 'numberSignal'
    });

    // @ts-expect-error - Should not allow string assignment
    signal.value = '42';
  });
});