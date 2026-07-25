import pandas as pd
import json

file_path = r"H:\ملفات ايتام النجاة  للدفعه حتى ديسمبر 2025 - عدد  268\كشف صرف  كفالات ايتام النجاة للدفعة حتى ديسمبر2025 الاخير (2).xlsx"

raw_df = pd.read_excel(file_path, sheet_name="محدث كامل 2026", header=None)

# Row index 2 contains column headers
headers = list(raw_df.iloc[2])

# Clean header strings
clean_headers = []
for idx, h in enumerate(headers):
    h_str = str(h).strip().replace('\n', ' ') if pd.notnull(h) else f"col_{idx}"
    clean_headers.append(h_str)

df = raw_df.iloc[3:].copy()
df.columns = clean_headers

print("Columns extracted:")
for idx, c in enumerate(clean_headers):
    print(f"Col {idx}: {c}")

orphans = []
families_dict = {}

for idx, row in df.iterrows():
    # Orphan Name is at Col index 20 (or matching 'اليتيم')
    name = str(row.get('اليتيم', '')).strip()
    if not name or name == 'nan' or name == 'اليتيم' or 'إجمالي' in name or 'الجهة' in name:
        continue
    
    m_code = str(row.get('م', '')).strip()
    mumaiyo = str(row.get('المميز', '')).strip()
    saudi_acc = str(row.get('السعودي', '')).strip()

    father_name = str(row.get('اسم الاب', '')).strip()
    mother_name = str(row.get('اسم الام', '')).strip()
    gender_str = str(row.get('الجنس', '')).strip()
    gender = "FEMALE" if "انث" in gender_str or "أنث" in gender_str or "نث" in gender_str else "MALE"
    
    bdate = row.get('تاريخ الميلاد')
    bdate_str = str(bdate)[:10] if pd.notnull(bdate) else None
    
    gov = str(row.get('المحافظه', '')).strip()
    dist = str(row.get('المديريه', '')).strip()
    isolation = str(row.get('العزله', '')).strip()
    region = str(row.get('المنطقه', '')).strip()
    
    orphan_type = str(row.get('يتيم الابوين', '')).strip()
    death_date = row.get('تاريخ الوفاه')
    death_date_str = str(death_date)[:10] if pd.notnull(death_date) else None
    death_reason = str(row.get('سبب الوفاه', '')).strip()
    
    edu_stage = str(row.get('المرحله الدراسيه', '')).strip()
    school = str(row.get('المدرسه', '')).strip()
    grade = str(row.get('الصف', '')).strip()
    quran = str(row.get('الحفظ من القران', '')).strip()
    hobbies = str(row.get('هويات اليتيم', '')).strip()
    
    health_general = str(row.get('الحاله الصحيه العامه لليتيم', '')).strip()
    illness_type = str(row.get('نوع المرض', '')).strip()
    housing = str(row.get('السكن(ملك ــ ايجارــ مع الاهل)', '')).strip()
    
    guardian_name = str(row.get('اسم المعيل', '')).strip()
    guardian_relation = str(row.get('علاقته باليتيم', '')).strip()
    guardian_job = str(row.get('عمله', '')).strip()
    
    phone1 = str(row.get('رقم الهاتف1 الوتس', '')).strip()
    phone2 = str(row.get('رقم الهاتف12', '')).strip()

    # Family key
    fam_key = mother_name if mother_name and mother_name != 'nan' else guardian_name
    if not fam_key or fam_key == 'nan':
        fam_key = father_name if father_name and father_name != 'nan' else name

    if fam_key not in families_dict:
        families_dict[fam_key] = {
            "familyHeadName": fam_key if fam_key != 'nan' else mother_name,
            "motherName": mother_name if mother_name != 'nan' else None,
            "guardianName": guardian_name if guardian_name != 'nan' else None,
            "guardianRelation": guardian_relation if guardian_relation != 'nan' else None,
            "guardianJob": guardian_job if guardian_job != 'nan' else None,
            "governorate": gov if gov != 'nan' else "تعز",
            "district": dist if dist != 'nan' else "المدينة",
            "isolation": isolation if isolation != 'nan' else None,
            "region": region if region != 'nan' else None,
            "housing": housing if housing != 'nan' else None,
            "phone": phone1 if phone1 != 'nan' and phone1 != '0.0' else (phone2 if phone2 != 'nan' else None),
            "orphansCount": 0
        }
    families_dict[fam_key]["orphansCount"] += 1

    orphan_rec = {
        "m_code": m_code if m_code != 'nan' else None,
        "fullName": name,
        "fatherName": father_name if father_name != 'nan' else None,
        "motherName": mother_name if mother_name != 'nan' else None,
        "gender": gender,
        "birthdate": bdate_str,
        "mumaiyo": mumaiyo if mumaiyo != 'nan' else None,
        "saudiAccount": saudi_acc if saudi_acc != 'nan' else None,
        "governorate": gov if gov != 'nan' else "تعز",
        "district": dist if dist != 'nan' else "المدينة",
        "isolation": isolation if isolation != 'nan' else None,
        "region": region if region != 'nan' else None,
        "orphanType": orphan_type if orphan_type != 'nan' else "يتيم الاب",
        "deathDate": death_date_str,
        "deathReason": death_reason if death_reason != 'nan' else None,
        "educationalStage": edu_stage if edu_stage != 'nan' else None,
        "school": school if school != 'nan' else None,
        "grade": grade if grade != 'nan' else None,
        "quranMemorization": quran if quran != 'nan' else None,
        "hobbies": hobbies if hobbies != 'nan' else None,
        "healthStatus": health_general if health_general != 'nan' else "جيدة",
        "illnessType": illness_type if illness_type != 'nan' else None,
        "housing": housing if housing != 'nan' else None,
        "guardianName": guardian_name if guardian_name != 'nan' else None,
        "guardianRelation": guardian_relation if guardian_relation != 'nan' else None,
        "familyKey": fam_key,
        "phone": phone1 if phone1 != 'nan' and phone1 != '0.0' else None,
        "sponsor": "جمعية النجاة الخيرية - الكويت"
    }
    orphans.append(orphan_rec)

summary = {
    "total_orphans": len(orphans),
    "total_families": len(families_dict),
    "sponsor": "جمعية النجاة الخيرية - الكويت"
}

out_data = {
    "summary": summary,
    "families": list(families_dict.values()),
    "orphans": orphans
}

json_path = r"F:\Food management system for the organization\scratch\alnajah_parsed.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(out_data, f, ensure_ascii=False, indent=2)

print("\nPARSED_ALNAJAH_SUCCESSFULLY")
print(f"Total Orphans Parsed: {len(orphans)}")
print(f"Total Families Parsed: {len(families_dict)}")
