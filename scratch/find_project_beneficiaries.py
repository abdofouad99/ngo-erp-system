import os, sys
import psycopg2
import uuid

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

# 1. Find sponsors and their active sponsorships
cursor.execute("""
    SELECT s.id, s."fullName", s.organization, COUNT(sp.id) as sponsorship_count
    FROM sponsors s
    LEFT JOIN sponsorships sp ON sp."sponsorId" = s.id AND sp."deletedAt" IS NULL
    WHERE s."deletedAt" IS NULL
    GROUP BY s.id, s."fullName", s.organization
""")
sponsors = cursor.fetchall()
print("🏢 الكفلاء المتاحين وعدم كفالاتهم:")
for sp in sponsors:
    print(f"  • ID: {sp[0]} | Name: {sp[1]} | Org: {sp[2]} | Sponsorships: {sp[3]}")

print("\n" + "="*50 + "\n")

# 2. Check beneficiaries for each project type
cursor.execute("""
    SELECT p.id, p.name, p."targetCount", p.category
    FROM projects p
    WHERE p."deletedAt" IS NULL
""")
projects = cursor.fetchall()

for proj in projects:
    p_id, p_name, p_target, p_cat = proj
    print(f"📁 فحص المشروع: {p_name} (ID: {p_id}, target: {p_target})")
    
    # Try to find matching beneficiaries via sponsorships
    if "بيت الزكاة" in p_name:
        cursor.execute("""
            SELECT DISTINCT sp."beneficiaryId"
            FROM sponsorships sp
            JOIN sponsors s ON s.id = sp."sponsorId"
            WHERE (s."fullName" LIKE '%زكاة%' OR s.organization LIKE '%زكاة%' OR s."fullName" LIKE '%Zakat%')
            AND sp."beneficiaryId" IS NOT NULL
            AND sp."deletedAt" IS NULL
        """)
        b_ids = [r[0] for r in cursor.fetchall()]
        print(f"   🔍 عثرنا على {len(b_ids)} مستفيد كفالة من بيت الزكاة")
    
    elif "النجاة" in p_name:
        cursor.execute("""
            SELECT DISTINCT sp."beneficiaryId"
            FROM sponsorships sp
            JOIN sponsors s ON s.id = sp."sponsorId"
            WHERE (s."fullName" LIKE '%نجاة%' OR s.organization LIKE '%نجاة%' OR s."fullName" LIKE '%Najah%')
            AND sp."beneficiaryId" IS NOT NULL
            AND sp."deletedAt" IS NULL
        """)
        b_ids = [r[0] for r in cursor.fetchall()]
        print(f"   🔍 عثرنا على {len(b_ids)} مستفيد كفالة من النجاة")

    elif "الدبوس" in p_name or "تنمية" in p_name:
        cursor.execute("""
            SELECT DISTINCT sp."beneficiaryId"
            FROM sponsorships sp
            JOIN sponsors s ON s.id = sp."sponsorId"
            WHERE (s."fullName" LIKE '%تنمية%' OR s.organization LIKE '%تنمية%' OR s."fullName" LIKE '%دبوس%')
            AND sp."beneficiaryId" IS NOT NULL
            AND sp."deletedAt" IS NULL
        """)
        b_ids = [r[0] for r in cursor.fetchall()]
        print(f"   🔍 عثرنا على {len(b_ids)} مستفيد كفالة من تنمية/الدبوس")

    elif "الصفا" in p_name:
        cursor.execute("""
            SELECT DISTINCT sp."beneficiaryId"
            FROM sponsorships sp
            JOIN sponsors s ON s.id = sp."sponsorId"
            WHERE (s."fullName" LIKE '%صفا%' OR s.organization LIKE '%صفا%' OR s."fullName" LIKE '%Safa%')
            AND sp."beneficiaryId" IS NOT NULL
            AND sp."deletedAt" IS NULL
        """)
        b_ids = [r[0] for r in cursor.fetchall()]
        print(f"   🔍 عثرنا على {len(b_ids)} مستفيد كفالة من الصفا")

cursor.close()
conn.close()
