import hashlib, json, sys
from pathlib import Path
p = Path(sys.argv[1])
expected = sys.argv[2]
message_index = int(sys.argv[3])
start = int(sys.argv[4])
raw = p.read_bytes()
assert hashlib.sha256(raw).hexdigest() == expected, "payload digest mismatch"
messages = json.loads(raw)["messages"]
assert [m["role"] for m in messages] == ["system", "user"]
assert message_index in (0, 1)
s = messages[message_index]["content"]
assert start >= 0 and start % 12000 == 0 and start < len(s)
end = min(start + 12000, len(s))
part = s[start:end]
print(json.dumps({"payloadSha256":expected,"messageIndex":message_index,"role":messages[message_index]["role"],"messageCharacters":len(s),"start":start,"endExclusive":end,"chunkSha256":hashlib.sha256(part.encode()).hexdigest()},sort_keys=True))
print(part, end="")
