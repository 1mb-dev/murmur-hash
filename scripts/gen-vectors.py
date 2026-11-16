# Regenerates test/vectors.json from Python mmh3, an implementation independent of this package.
# Run by hand, never in CI:
#   python3 -m venv .venv && .venv/bin/pip install mmh3==5.3.1
#   .venv/bin/python scripts/gen-vectors.py test/vectors.json
# Hex fields use this package's word order: each 32-bit (x86) or 64-bit (x64) word printed
# big-endian, so mmh3's little-endian digest bytes are reversed per word.
import json
import random
import sys

import mmh3

random.seed(7)
seeds = [0, 1, 42, 0x9747B28C, 0xFFFFFFFF, 0x80000000]
inputs = []
for n in range(0, 34):
    inputs.append(("bytes", bytes(((i * 37 + 200) & 255) for i in range(n))))
    inputs.append(("ascii", "".join(chr(48 + (i % 43)) for i in range(n))))
for n in (64, 255, 1000, 4099):
    inputs.append(("bytes", bytes(random.randrange(256) for _ in range(n))))
for s in [
    "héllo",
    "日本語テキスト",
    "🎉🎉 party",
    "Ünïcödé ✓ ok",
    "I will not buy this record, it is scratched.",
    "The quick brown fox jumps over the lazy dog",
]:
    inputs.append(("str", s))

cases = []
for kind, v in inputs:
    b = v if isinstance(v, bytes) else v.encode("utf-8")
    for sd in seeds:
        x86 = mmh3.hash_bytes(b, sd, x64arch=False)
        x64 = mmh3.hash_bytes(b, sd, x64arch=True)
        cases.append(
            {
                "kind": kind,
                "s": v if isinstance(v, str) else None,
                "b": b.hex(),
                "seed": sd,
                "h32": mmh3.hash(b, sd, signed=False),
                "x86": "".join(x86[i : i + 4][::-1].hex() for i in range(0, 16, 4)),
                "x64": "".join(x64[i : i + 8][::-1].hex() for i in range(0, 16, 8)),
            }
        )

with open(sys.argv[1], "w", encoding="utf-8") as f:
    rows = (json.dumps(c, ensure_ascii=False, separators=(",", ":")) for c in cases)
    f.write("[\n" + ",\n".join(rows) + "\n]\n")
print(len(cases))
