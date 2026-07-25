import pandas as pd
import json
import os
import re

file_path = r"C:\Users\my computer\Downloads\قاعدة ايتام الزكاة محدث 23-7-2026.xlsx"
out_json = r"C:\Users\my computer\.gemini\antigravity\brain\b1f67750-12b1-4ef0-90a2-b46de15cbea6\scratch\zakat_2026_parsed.json"

df = pd.read_excel(file_path, sheet_name="2026")

def clean_str(val):
    if pd.isna(val):
        return None
    s = str(val).strip()
    if s.lower() in ['nan', 'nat', 'null', '']:
        return None
    if s.endswith('.0') and s[:-2].isdigit():
        s = s[:-2]
    return s

def clean_date_str(val):
    if pd.isna(val):
        return None
    try:
        if isinstance(val, pd.Timestamp):
            return val.strftime('%Y-%m-%d')
        s = str(val).strip()
        if s.lower() in ['nan', 'nat', 'null', '']:
            return None
        t = pd.to_datetime(s, errors='coerce')
        if pd.notna(t):
            return t.strftime('%Y-%m-%d')
        return s
    except:
        return None

families = {}
orphans = []

# Row 0 contains sub-headers, data starts at index 1
for idx in range(1, len(df)):
    row = df.iloc[idx]
    
    orphan_name = clean_str(row.iloc[7]) # اسم اليتيم
    short_name = clean_str(row.iloc[8])  # اسم اليتيم مختصر
    caregiver_name = clean_str(row.iloc[42]) # اسم المعيل
    
    if not orphan_name and not caregiver_name:
        continue
        
    gov = clean_str(row.iloc[15]) or "تعز"
    dist = clean_str(row.iloc[16]) or "المدينة"
    sub_dist = clean_str(row.iloc[17]) or "مركزي"
    region = clean_str(row.iloc[18])
    address = clean_str(row.iloc[21]) or clean_str(row.iloc[18])
    
    phone1 = clean_str(row.iloc[49])
    phone2 = clean_str(row.iloc[50])
    phone_all = clean_str(row.iloc[54])
    phone = phone1 or phone2 or phone_all
    
    caregiver_rel = clean_str(row.iloc[45]) or "ام اليتيم"
    caregiver_job = clean_str(row.iloc[44])
    
    # Unique family key
    name_slug = re.sub(r'\s+', '_', caregiver_name or orphan_name or "unknown")
    phone_slug = phone or f"row-{idx}"
    fam_key = f"FAM-{name_slug}-{phone_slug}"
    
    if fam_key not in families:
        families[fam_key] = {
            "key": fam_key,
            "headFullName": caregiver_name or "معيل غير مدون",
            "headPhoneNumber": phone,
            "headAltPhone": phone2 if phone1 else None,
            "governorate": gov,
            "district": dist,
            "subDistrict": sub_dist,
            "addressDetail": address,
            "relation": caregiver_rel,
            "notes": "مستورد من قاعدة أيتام بيت الزكاة للعام 2026",
            "members_count": 1
        }
    else:
        families[fam_key]["members_count"] += 1
        
    birthdate = clean_date_str(row.iloc[12])
    gender_raw = clean_str(row.iloc[11])
    gender_mapped = "FEMALE" if gender_raw and ("أنثى" in gender_raw or "انثى" in gender_raw or "FEMALE" in gender_raw.upper()) else "MALE"
    
    orphan_code = clean_str(row.iloc[5]) # كود النظام
    mumaiyo = clean_str(row.iloc[3])
    kuraimi_new = clean_str(row.iloc[4])
    kuraimi_old = clean_str(row.iloc[1])
    
    edu_stage = clean_str(row.iloc[29])
    school = clean_str(row.iloc[30])
    grade = clean_str(row.iloc[31])
    quran = clean_str(row.iloc[33])
    health = clean_str(row.iloc[36]) or clean_str(row.iloc[38])
    sponsor = clean_str(row.iloc[56]) or "بيت الزكاة"
    
    orphans.append({
        "fullName": orphan_name or "يتيم غير مدون",
        "shortName": short_name,
        "gender": gender_mapped,
        "birthdate": birthdate or "2012-01-01",
        "orphanCode": orphan_code,
        "mumaiyo": mumaiyo,
        "kuraimiAccount": kuraimi_new or kuraimi_old,
        "kuraimiAccountOld": kuraimi_old,
        "educationLevel": grade,
        "schoolName": school,
        "educationalStage": edu_stage,
        "notes": f"الحفظ من القرآن: {quran}" if quran else None,
        "familyKey": fam_key,
        "motherName": clean_str(row.iloc[25]),
        "fatherDeathDate": clean_date_str(row.iloc[23]),
        "fatherDeathCause": clean_str(row.iloc[24]),
        "healthStatus": health or "سليم",
        "sponsor": sponsor
    })

data = {
    "families": list(families.values()),
    "orphans": orphans
}

with open(out_json, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"✅ Extracted {len(families)} families and {len(orphans)} orphans from Zakat 2026 file!")
