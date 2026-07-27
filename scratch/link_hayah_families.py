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

PROJECT_ID = 'proj-alhayah-families-2026'

# Step 1: Fix project category to CASH and targetCount to 3 families
cursor.execute("""
    UPDATE projects
    SET category = 'CASH', "targetCount" = 3
    WHERE id = %s
""", (PROJECT_ID,))
print(f"✅ Project category fixed to CASH, targetCount set to 3 families")

# Step 2: Delete any existing links for this project
cursor.execute("""
    DELETE FROM project_beneficiaries
    WHERE "projectId" = %s
""", (PROJECT_ID,))
print(f"🗑️ Cleared old links")

# Step 3: The 3 families and their representative beneficiaries (first child = representative)
# We'll link the HEAD of each family by using the first beneficiary from each family
families_data = [
    {
        "head_name": "أشواق عبدالعزيز علي محمد",
        "phone": "777930032",
        "beneficiary_ids": [
            "cms3j0z8q0001f0vp9wul2d4s",  # عمر
            "cms3j15cm0004f0vploc83nuk",  # انس
            "cms3j19rx0007f0vpmm8pkupo",  # سيف
        ]
    },
    {
        "head_name": "عبير عبده غالب وهبة",
        "phone": "773045967",
        "beneficiary_ids": [
            "cms3j1d2b000af0vpx05hjwjt",  # شذى
            "cms3j1h4g000df0vp8vbhallz",  # رياض
            "cms3j1kbw000gf0vpw5w4ib2c",  # شهد
            "cms3j1nkm000jf0vp0ym78s0k",  # ريماس
            "cms3j1qtd000mf0vph58cgp5j",  # قصي
            "cms3j1v7i000pf0vpt5whfkpp",  # نور
            "cms3j1y7n000sf0vpjagscrhh",  # كنان
        ]
    },
    {
        "head_name": "بشرى عبدالله غالب",
        "phone": "783316533",
        "beneficiary_ids": [
            "cms3j22of000xf0vp4ysiht8i",  # أمير
            "cms3j25i10010f0vpjz8l2zf1",  # عدي
        ]
    },
]

# Step 4: Insert one project_beneficiary link per FAMILY (representative = first child)
# We link one per family (the family head concept) with batchNumber = 1
batch = 1
linked = 0
for fam in families_data:
    # Use the first beneficiary as the family representative
    rep_id = fam["beneficiary_ids"][0]
    link_id = str(uuid.uuid4())

    cursor.execute("""
        INSERT INTO project_beneficiaries
            (id, "projectId", "beneficiaryId", "batchNumber", "deliveredItem",
             quantity, "unitValue", currency, "isDelivered", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT DO NOTHING
    """, (
        link_id,
        PROJECT_ID,
        rep_id,
        batch,
        "كفالة شهرية - أسرة متعففة",
        1,
        None,
        "YER",
        True,  # already delivered since project is COMPLETED
    ))

    # Get the name for confirmation
    cursor.execute("SELECT \"fullName\" FROM beneficiaries WHERE id = %s", (rep_id,))
    name_row = cursor.fetchone()
    name = name_row[0] if name_row else "؟"
    print(f"  ✅ ربط الأسرة {batch}: {fam['head_name']} (ممثل: {name})")
    batch += 1
    linked += 1

conn.commit()
print(f"\n🎉 تم ربط {linked} أسرة بمشروع كفالة الأسر المتعففة - مؤسسة الحياة الخيرية")

# Verify
cursor.execute("""
    SELECT pb.id, b."fullName", pb."batchNumber", pb."deliveredItem", pb."isDelivered"
    FROM project_beneficiaries pb
    JOIN beneficiaries b ON b.id = pb."beneficiaryId"
    WHERE pb."projectId" = %s
    AND pb."deletedAt" IS NULL
""", (PROJECT_ID,))
rows = cursor.fetchall()
print(f"\n📋 الروابط المسجلة الآن ({len(rows)}):")
for r in rows:
    print(f"  • {r[1]} | دفعة {r[2]} | {r[3]} | مسلّم: {r[4]}")

cursor.close()
conn.close()
