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

# Set all 5 projects to COMPLETED with targets and budgets
projects_data = [
    ("proj-tanmiya-dabbous-2025", "مشروع كفالة الأسر المتعففة 2025 - ناصر الدبوس (تنمية)", "COMPLETED", 25, 25000, "KWD"),
    ("proj-zakat-house-2026", "مشروع كفالة الأيتام 2026 - بيت الزكاة الكويتي", "COMPLETED", 770, 150000, "KWD"),
    ("proj-safa-quran-2026", "مشروع برنامج القرآن الكريم والدعاة - جمعية الصفا الخيرية", "COMPLETED", 105, 35000, "USD"),
    ("proj-najah-orphans-2025", "مشروع كفالة الأيتام المحدثة - جمعية النجاة الخيرية", "COMPLETED", 228, 68000, "KWD"),
    ("proj-alhayah-families-2026", "مشروع كفالة الأسر المتعففة - مؤسسة الحياة الخيرية", "COMPLETED", 12, 1500000, "YER"),
]

for p_id, name, status, target, budget, curr in projects_data:
    cursor.execute("""
        UPDATE projects
        SET 
            "status" = %s,
            "targetCount" = %s,
            "budget" = %s,
            "currency" = %s
        WHERE "id" = %s OR "name" LIKE %s
    """, (status, target, budget, curr, p_id, f"%{name[:10]}%"))

conn.commit()
print("✅ Updated 5 Projects to COMPLETED status with target counts!")

cursor.execute('SELECT name, status, "targetCount", budget, currency FROM projects;')
rows = cursor.fetchall()
for r in rows:
    print(f"  • {r[0]}: status={r[1]}, target={r[2]}, budget={r[3]} {r[4]}")

cursor.close()
conn.close()
