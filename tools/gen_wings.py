"""🪽 Wings (fashion, diamond wheel only — director 14 Nov): one wing picture per tier, drawn behind / in front of any hero.
Sample step: python3 -I tools/gen_wings.py [tier ...]  -> art-source/pixellab/wings/<tier>_s.png (facing the viewer)"""
import os, sys, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixellab_api as P

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'art-source', 'pixellab', 'wings'); os.makedirs(OUT, exist_ok=True)
SEED = 4127   # (keep: the approved sample's seed is reused for the other directions)
TAIL = (', a pair of wings only, no person, no body, no head, an empty gap in the middle between the two wings where a back would be, '
        'symmetrical, both wings spread wide and slightly raised, seen from behind and slightly above like a classic 2D top-down RPG, '
        'not isometric, no ground, no background, pixel art, soft shading, readable at small size')
WINGS = {
    'legend': 'large white feathered angel wings with warm gold trim along the feather edges, layered feathers, ivory and pale gold',
    'sl': 'large deep crimson feathered wings, the feather tips turning into small orange and yellow flames, dark red to ember orange',
    'ltd': 'large dark blue and violet feathered storm wings, thin bright cyan lightning lines running along the wing edges',
}
def one(k):
    out = os.path.join(OUT, f'{k}_s.png')
    try: P.map_object(WINGS[k] + TAIL, 80, 64, out, 'low top-down', seed=SEED); return k, 'ok'
    except Exception as e: return k, f'err {e}'
if __name__ == '__main__':
    ks = sys.argv[1:] or list(WINGS)
    with cf.ThreadPoolExecutor(3) as ex:
        for r in ex.map(one, ks): print(*r, flush=True)
