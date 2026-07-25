import json
import pandas as pd

json_path = r"C:\Users\my computer\.gemini\antigravity\brain\b1f67750-12b1-4ef0-90a2-b46de15cbea6\scratch\safa_program_parsed.json"

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

huffaz = data["huffaz"]
muhaffiz = data["muhaffiz"]
daiyah = data["daiyah"]

print(f"VERIFICATION_CHECK:")
print(f"Huffaz Count: {len(huffaz)}")
print(f"Muhaffiz Count: {len(muhaffiz)}")
print(f"Daiyah Count: {len(daiyah)}")

# Check sample keys for each to verify complete field coverage
print("\nHuffaz Sample Keys:")
print(list(huffaz[0].keys()))

print("\nMuhaffiz Sample Keys:")
print(list(muhaffiz[0].keys()))

print("\nDaiyah Sample Keys:")
print(list(daiyah[0].keys()))
