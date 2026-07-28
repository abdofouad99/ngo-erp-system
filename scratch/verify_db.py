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
    SELECT p.name, p."targetCount", COUNT(pb.id)
    FROM projects p
    LEFT JOIN project_beneficiaries pb ON pb."projectId" = p.id AND pb."deletedAt" IS NULL
    WHERE p."deletedAt" IS NULL
    GROUP BY p.id, p.name, p."targetCount"
""")
summary = cursor.fetchall()
print("📊 التأكد النهائي من قاعدة البيانات:")
total = 0
for s in summary:
    print(f"  • {s[0]}: المستهدف = {s[1]} | المسجلين بالأسماء = {s[2]}")
    total += s[2]

print(f"\nإجمالي السجلات المرتبطة بالأسماء: {total}")

cursor.close()
conn.close()
