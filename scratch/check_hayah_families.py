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

# 1) Check Al-Hayah project
cursor.execute("""
    SELECT id, name, category, status, "targetCount", budget, currency
    FROM projects
    WHERE id = 'proj-alhayah-families-2026'
""")
proj = cursor.fetchone()
print(f"📁 المشروع: {proj}")

# 2) Find families whose data came from الحياة (social org = الحياة or tagged)
# Look for families with socialStatus containing الحياة, or sub-districts in الحياة area
# First let's see all families to find the 3 Hayah families
cursor.execute("""
    SELECT f.id, f."headFullName", f."headPhoneNumber", f."socialStatus", f."subDistrictId",
           b.id as beneficiary_id, b."fullName", b."isActive"
    FROM families f
    LEFT JOIN beneficiaries b ON b."familyId" = f.id AND b."deletedAt" IS NULL
    WHERE f."deletedAt" IS NULL
    AND (f."socialStatus" LIKE '%الحياة%' OR f."socialStatus" LIKE '%حياة%'
         OR f.id IN (
            SELECT DISTINCT pb."beneficiaryId"::text FROM project_beneficiaries pb
            WHERE pb."projectId" = 'proj-alhayah-families-2026'
         )
    )
    LIMIT 20
""")
rows = cursor.fetchall()
print(f"\n🔍 الأسر المرتبطة بالحياة ({len(rows)} صف):")
for r in rows:
    print(f"  family={r[0]}, اسم={r[1]}, هاتف={r[2]}, وضع={r[3]}, beneficiary_id={r[5]}, اسم_المستفيد={r[6]}")

# 3) Check existing beneficiary links for this project
cursor.execute("""
    SELECT pb.id, pb."beneficiaryId", b."fullName", pb."isDelivered", pb."batchNumber"
    FROM project_beneficiaries pb
    JOIN beneficiaries b ON b.id = pb."beneficiaryId"
    WHERE pb."projectId" = 'proj-alhayah-families-2026'
    AND pb."deletedAt" IS NULL
""")
links = cursor.fetchall()
print(f"\n🔗 روابط مشروع الحياة الحالية ({len(links)}):")
for l in links:
    print(f"  link_id={l[0]}, beneficiary={l[2]}, delivered={l[3]}")

# 4) Show recent families (last 10 added) - likely the Hayah ones
cursor.execute("""
    SELECT f.id, f."headFullName", f."headPhoneNumber", f."socialStatus", f."createdAt",
           b.id as bid, b."fullName", b."category"
    FROM families f
    LEFT JOIN beneficiaries b ON b."familyId" = f.id AND b."deletedAt" IS NULL AND b."isActive" = true
    WHERE f."deletedAt" IS NULL
    ORDER BY f."createdAt" DESC
    LIMIT 15
""")
recent = cursor.fetchall()
print(f"\n📋 آخر 15 أسرة مضافة:")
for r in recent:
    print(f"  [{r[4].date()}] {r[1]} | هاتف: {r[2]} | beneficiary_id: {r[5]} | اسم: {r[6]} | فئة: {r[7]}")

cursor.close()
conn.close()
