import { formatToBoundedExp40Dec } from '../bounded-exp40dec';

describe('formatToBoundedExp40Dec', () => {
  it('scales 1 to 1e18', () => {
    expect(formatToBoundedExp40Dec(1)).toBe('1000000000000000000');
  });

  it('scales 0.5 to 5e17', () => {
    expect(formatToBoundedExp40Dec(0.5)).toBe('500000000000000000');
  });

  it('scales 123.456 correctly', () => {
    expect(formatToBoundedExp40Dec('123.456')).toBe('123456000000000000000');
  });

  it('scales 0 to 0', () => {
    expect(formatToBoundedExp40Dec(0)).toBe('0');
  });

  it('throws on invalid string', () => {
    expect(() => formatToBoundedExp40Dec('invalid-string')).toThrow();
  });

  it('throws on null/undefined', () => {
    const fn: any = formatToBoundedExp40Dec;
    expect(() => fn(null)).toThrow();
    expect(() => fn(undefined)).toThrow();
  });
});


