import { describe, it, expect } from 'vitest';
import { newGameState as newGame } from '../src/core/state';
import { spinWings, setWing, activeWing, ownsWing, WSLOT_PRICE, WSLOT_PRICE10 } from '../src/systems/wings';
import { WINGS } from '../src/data/wings';

let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const rich = () => { const s = newGame() as ReturnType<typeof newGame> & { diamonds?: number; stars?: number; wings?: string[] }; s.diamonds = 1_000_000; return s; };

describe('🪽 wing slot machine (director 14 Nov)', () => {
  it('costs diamonds, refuses without them, 10 spins = 10 prizes', () => {
    const s = rich(); s.diamonds = 10; expect(spinWings(s, 1, rnd)).toBe('diamonds');
    s.diamonds = WSLOT_PRICE10; const r = spinWings(s, 10, rnd); expect(typeof r).toBe('object');
    if (typeof r === 'object') { expect(r.prizes.length).toBe(10); expect(s.diamonds).toBe(0); }
    s.diamonds = WSLOT_PRICE; expect(typeof spinWings(s, 1, rnd)).toBe('object'); expect(spinWings(s, 3, rnd)).toBe('n');
  });
  it('wings come out rarely, Limited never while closed, a second copy turns into stars', () => {
    const s = rich(); let wings = 0, ltd = 0;
    for (let i = 0; i < 3000; i++) { const r = spinWings(s, 10, rnd); if (typeof r !== 'object') { s.inventory.length = 0; continue; } for (const p of r.prizes) if (p.wing) { wings++; if (p.wing.startsWith('x_') || p.wing === 'ltd') ltd++; } s.inventory.length = 0; }
    expect(ltd).toBe(0);
    expect(wings / 30000).toBeGreaterThan(0.015); expect(wings / 30000).toBeLessThan(0.04);
    expect(s.wings!.length).toBeLessThanOrEqual(WINGS.length); expect((s.stars ?? 0)).toBeGreaterThan(0);
  });
  it('only owned wings can be worn', () => {
    const s = rich(); expect(setWing(s, 'legend')).toBe(false); expect(activeWing(s)).toBeNull();
    s.wings = ['legend']; expect(ownsWing(s, 'legend')).toBe(true); setWing(s, 'legend'); expect(activeWing(s)?.id).toBe('legend');
    setWing(s, null); expect(activeWing(s)).toBeNull();
  });
});
