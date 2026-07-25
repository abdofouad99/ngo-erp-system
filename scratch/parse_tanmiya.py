import pandas as pd
import json
import re

file_path = r"C:\Users\my computer\Downloads\ايتام تنمية الخيرية عدد 25 يتيم.xlsx"
out_json = r"C:\Users\my computer\.gemini\antigravity\brain\b1f67750-12b1-4ef0-90a2-b46de15cbea6\scratch\tanmiya_parsed.json"

df = pd.read_excel(file_path, sheet_name="ورقة1")

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
        t = pd.to_datetime(s, errors='coerce', dayfirst=True)
        if pd.notna(t):
            return t.strftime('%Y-%m-%d')
        return s
    except:
        return None

families = {}
orphans = []

# Row 0 contains sub-headers, data rows start at index 1 to 25
for idx in range(1, len(df)):
    row = df.iloc[idx]
    
    orphan_name = clean_str(row.iloc[1])
    if not orphan_name:
        continue
        
    city = clean_str(row.iloc[2]) or "تعز"
    district = clean_str(row.iloc[3]) or "المدينة"
    address = clean_str(row.iloc[13]) or city
    
    gender_raw = clean_str(row.iloc[14])
    gender_mapped = "FEMALE" if gender_raw and ("أنثى" in gender_raw or "انثى" in gender_raw or "FEMALE" in gender_raw.upper()) else "MALE"
    
    birthdate = clean_date_str(row.iloc[15])
    edu_stage = clean_str(row.iloc[17])
    grade = clean_str(row.iloc[18])
    grade_eval = clean_str(row.iloc[19])
    quran = clean_str(row.iloc[20])
    health = clean_str(row.iloc[21]) or "سليم"
    
    phone1 = clean_str(row.iloc[22])
    phone2 = clean_str(row.iloc[23]) if len(row) > 23 else None
    phone = phone1 or phone2
    
    # Extract caregiver name from father's name or orphan's name
    # e.g., "هاجر خليل عبده محمد عبدالملك" -> Caregiver/Family: "أسرة خليل عبده محمد عبدالملك"
    name_parts = orphan_name.split()
    father_caregiver = " ".join(name_parts[1:]) if len(name_parts) > 1 else orphan_name
    caregiver_name = f"أسرة المرحوم {father_caregiver}" if father_caregiver else "معيل غير مدون"
    
    fam_slug = re.sub(r'\s+', '_', father_caregiver or "unknown")
    phone_slug = phone or f"tanmiya-{idx}"
    fam_key = f"FAM-TANMIYA-{fam_slug}-{phone_slug}"
    
    if fam_key not in families:
        families[fam_key] = {
            "key": fam_key,
            "headFullName": caregiver_name,
            "headPhoneNumber": phone,
            "headAltPhone": phone2 if phone1 else None,
            "governorate": city,
            "district": district,
            "subDistrict": "مركز المديرية",
            "addressDetail": address,
            "relation": "أم اليتيم / المعيل",
            "notes": "مستورد من كفلية أيتام جمعية تنمية الخيرية 2026",
            "members_count": 1
        }
    else:
        families[fam_key]["members_count"] += 1
        
    notes_list = []
    if quran: notes_list.append(f"الحفظ من القرآن: {quran}")
    if grade_eval: notes_list.append(f"تقدير آخر سنة: {grade_eval}")
    notes_str = " - ".join(notes_list) if notes_list else None

    orphans.append({
        "fullName": orphan_name,
        "gender": gender_mapped,
        "birthdate": birthdate or "2015-01-01",
        "orphanCode": f"TANMIYA-{idx}",
        "educationLevel": grade,
        "educationalStage": edu_stage,
        "notes": notes_str,
        "familyKey": fam_key,
        "fatherDeathCause": "توفي والده",
        "healthStatus": health,
        "sponsor": "جمعية تنمية الخيرية",
        "projectName": "كفالتهم جنة - رعاية وكفالة الأيتام"
    })

data = {
    "families": list(families.values()),
    "orphans": orphans
}

with open(out_json, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Parsed {len(families)} families and {len(orphans)} orphans from Tanmiya Charity file.")
