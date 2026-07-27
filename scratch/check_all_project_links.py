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

cursor.execute("""
    SELECT p.id, p.name, p."targetCount", COUNT(pb.id) as linked_count
    FROM projects p
    LEFT JOIN project_beneficiaries pb ON pb."projectId" = p.id AND pb."deletedAt" IS NULL
    WHERE p."deletedAt" IS NULL
    GROUP BY p.id, p.name, p."targetCount"
""")
rows = cursor.fetchall()
print("📊 حالة ربط المشاريع بالمستفيدين في قاعدة البيانات:")
for r in rows:
    print(f"  • {r[1]}")
    print(f"    - المستهدف (targetCount): {r[2]}")
    print(f"    - المسجلين فعلياً في جدول project_beneficiaries: {r[3]}")
    print()

cursor.close()
conn.close()
