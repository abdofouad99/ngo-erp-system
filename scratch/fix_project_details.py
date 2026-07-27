import os, sys
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

env_vars = {}
if os.path.exists(".env"):
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                env_vars[k.strip()] = v.strip().strip('"').strip("'")

db_url = env_vars.get("DATABASE_URL") or env_vars.get("DIRECT_URL")
clean_url = db_url.split("?")[0]

conn = psycopg2.connect(clean_url)
cursor = conn.cursor()

# Set exact targets and budgets per project ID
projects = [
    ("proj-tanmiya-dabbous-2025", "COMPLETED", 25, 25000, "KWD"),
    ("proj-zakat-house-2026", "COMPLETED", 770, 150000, "KWD"),
    ("proj-safa-quran-2026", "COMPLETED", 105, 35000, "USD"),
    ("proj-najah-orphans-2025", "COMPLETED", 228, 68000, "KWD"),
    ("proj-alhayah-families-2026", "COMPLETED", 12, 1500000, "YER"),
]

for p_id, status, target, budget, curr in projects:
    cursor.execute("""
        UPDATE projects
        SET 
            "status" = %s,
            "targetCount" = %s,
            "budget" = %s,
            "currency" = %s
        WHERE "id" = %s
    """, (status, target, budget, curr, p_id))

conn.commit()

cursor.execute('SELECT id, name, status, "targetCount", budget, currency FROM projects;')
rows = cursor.fetchall()
print("📊 Current Projects in Database:")
for r in rows:
    print(f"  • [{r[0]}] {r[1]}: status={r[2]}, target={r[3]}, budget={r[4]} {r[5]}")

cursor.close()
conn.close()
