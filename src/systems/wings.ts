// 🪽 Wings: who owns which (server-written, `wings`), which one is out (`wingOn`, the player's own setting) and the
// 🎰 wing slot machine (director 14 Nov: the only way to get wings; no chances shown anywhere). The server rolls.
// Only one of mount / wings / storm cloud at a time (director): wings out = the cloud put away (and the hero gets off
// the mount — TopDownScene); the cloud out = the wings put away; on a mount neither shows.
import type { GameState } from '../core/state';
import { addItem } from './inventory';
import { invSize } from '../core/state';
import { WINGS, WING_BY_ID, type WingTier } from '../data/wings';

/** open to players (closed: the admin can try it) */
export const WSLOT_OPEN = false;
/** Limited wings can come out of the machine (kept for OBT — director) */
export const WSLOT_LTD = false;
export const WSLOT_PRICE = 30, WSLOT_PRICE10 = 270;
/** per 10,000 spins, each wing of the tier (never shown to players) */
const WEIGHT: Record<WingTier, number> = { L: 40, SL: 12, X: 7 };
/** a wing already owned turns into ⭐ star coins */
const DUP_STARS: Record<WingTier, number> = { L: 15, SL: 40, X: 80 };
/** everything else: a small useful prize (never gear / elixirs / shards — no pay-to-win) */
export const CONSOLATION = [{ id: 'hp_potion_l', qty: 5 }, { id: 'scroll_return', qty: 5 }] as const;

type WS = GameState & { wings?: string[]; wingOn?: string; petOn?: string; diamonds?: number; stars?: number };
export const wingsOf = (s: GameState) => (s as WS).wings ?? [];
export const ownsWing = (s: GameState, id: string) => wingsOf(s).includes(id);
/** the wings out now (owned and chosen), or null */
export function activeWing(s: GameState) { const id = (s as WS).wingOn; return id && ownsWing(s, id) && WING_BY_ID[id] ? WING_BY_ID[id] : null; }
/** put wings on (null = take them off); wings out = the storm cloud put away */
export function setWing(s: GameState, id: string | null) {
  const p = s as WS;
  if (id && !ownsWing(s, id)) return false;
  p.wingOn = id ?? 'none';   // (the UI also puts the cloud away and gets off the mount — server actions)
  return true;
}
/** the storm cloud is being put on: the wings come off (the other half of "one at a time") */
export function wingsOffForCloud(s: GameState) { (s as WS).wingOn = 'none'; }

export interface WPrize { wing?: string; item?: { id: string; qty: number }; stars?: number; text: string }
function roll(rnd: () => number, ltd: boolean): string | null {
  let r = rnd() * 10000;
  for (const w of WINGS) { if (w.tier === 'X' && !ltd) continue; r -= WEIGHT[w.tier]; if (r < 0) return w.id; }
  return null;
}
/** spin the machine 1 or 10 times (server) */
export function spinWings(s: GameState, n: number, rnd: () => number, ltd = WSLOT_LTD): 'diamonds' | 'bag' | 'n' | { prizes: WPrize[]; cost: number } {
  if (n !== 1 && n !== 10) return 'n';
  const p = s as WS, cost = n === 10 ? WSLOT_PRICE10 : WSLOT_PRICE;
  if ((p.diamonds ?? 0) < cost) return 'diamonds';
  if (s.inventory.length + 2 > invSize(s)) return 'bag';
  p.diamonds = (p.diamonds ?? 0) - cost;
  const prizes: WPrize[] = [];
  for (let i = 0; i < n; i++) {
    const id = roll(rnd, ltd);
    if (id) {
      const w = WING_BY_ID[id];
      if (ownsWing(s, id)) { const st = DUP_STARS[w.tier]; p.stars = (p.stars ?? 0) + st; prizes.push({ wing: id, stars: st, text: `${w.name} (มีแล้ว → ⭐ ${st})` }); }
      else { (p.wings ??= []).push(id); prizes.push({ wing: id, text: `🪽 ${w.name}!` }); }
    } else {
      const c = CONSOLATION[Math.floor(rnd() * CONSOLATION.length)];
      addItem(s, c.id, c.qty); prizes.push({ item: { id: c.id, qty: c.qty }, text: '' });
    }
  }
  return { prizes, cost };
}
