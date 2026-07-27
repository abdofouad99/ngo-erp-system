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

# Project Mappings to Sponsor Search Terms
mappings = [
    {
        "project_id": "proj-zakat-house-2026",
        "name_search": "%زكاة%",
        "delivered_item": "كفالة يتيم شهرية - بيت الزكاة",
    },
    {
        "project_id": "proj-najah-orphans-2025",
        "name_search": "%نجاة%",
        "delivered_item": "كفالة يتيم شهرية - جمعية النجاة",
    },
    {
        "project_id": "proj-tanmiya-dabbous-2025",
        "name_search": "%تنمية%",
        "delivered_item": "كفالة أسرة متعففة - جمعية تنمية (ناصر الدبوس)",
    },
    {
        "project_id": "proj-safa-quran-2026",
        "name_search": "%صفا%",
        "delivered_item": "مكافأة برنامج القرآن والدعاة - جمعية الصفا",
    },
]

total_inserted = 0

for m in mappings:
    p_id = m["project_id"]
    search_term = m["name_search"]
    item_name = m["delivered_item"]

    # 1. Fetch matching beneficiary IDs with amount & currency from sponsorships
    cursor.execute("""
        SELECT DISTINCT sp."beneficiaryId", sp.amount, sp.currency
        FROM sponsorships sp
        JOIN sponsors s ON s.id = sp."sponsorId"
        WHERE (s."fullName" LIKE %s OR s.organization LIKE %s)
        AND sp."beneficiaryId" IS NOT NULL
        AND sp."deletedAt" IS NULL
    """, (search_term, search_term))
    
    rows = cursor.fetchall()
    print(f"🔗 ربط مشروع {p_id}: وجدنا {len(rows)} مستفيد...")

    inserted_for_proj = 0
    for r in rows:
        b_id, amount, curr = r
        link_id = str(uuid.uuid4())
        currency_val = curr if curr else "USD"
        
        cursor.execute("""
            INSERT INTO project_beneficiaries
                (id, "projectId", "beneficiaryId", "batchNumber", "deliveredItem",
                 quantity, "unitValue", currency, "isDelivered", "deliveryDate", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, 1, %s, 1, %s, %s, true, NOW(), NOW(), NOW())
            ON CONFLICT ("projectId", "beneficiaryId", "batchNumber") DO NOTHING
        """, (link_id, p_id, b_id, item_name, amount, currency_val))
        
        inserted_for_proj += cursor.rowcount

    print(f"   ✅ تمت إضافة {inserted_for_proj} سجل ربط لمشروع {p_id}")
    total_inserted += inserted_for_proj

conn.commit()

print(f"\n🎉 إجمالي المستفيدين الذين تم ربطهم بالمشاريع بنجاح: {total_inserted}")

# Final verification
cursor.execute("""
    SELECT p.name, p."targetCount", COUNT(pb.id)
    FROM projects p
    LEFT JOIN project_beneficiaries pb ON pb."projectId" = p.id AND pb."deletedAt" IS NULL
    WHERE p."deletedAt" IS NULL
    GROUP BY p.id, p.name, p."targetCount"
""")
summary = cursor.fetchall()
print("\n📊 النتيجة النهائية لكشوفات المشاريع:")
for s in summary:
    print(f"  • {s[0]}: المستهدف = {s[1]} | المسجلين والمرتبطين بالأسماء = {s[2]}")

cursor.close()
conn.close()
