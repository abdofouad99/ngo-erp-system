import pandas as pd
import json
import re
import os

file_daiyah = r"C:\Users\my computer\Downloads\قاعدة بيانات داعية - الصفا.xlsx"
file_huffaz = r"C:\Users\my computer\Downloads\قاعدة بيانات الحفاظ - الصفا.xlsx"
file_muhaffiz = r"C:\Users\my computer\Downloads\قاعدة بيانات محفظ - الصفا .xlsx"

out_json = r"C:\Users\my computer\.gemini\antigravity\brain\b1f67750-12b1-4ef0-90a2-b46de15cbea6\scratch\safa_program_parsed.json"

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

# 1. Parse Preachers (الدعاة)
df_d = pd.read_excel(file_daiyah, sheet_name="1")
daiyah_list = []

for idx in range(len(df_d)):
    row = df_d.iloc[idx]
    name = clean_str(row.iloc[1])
    if not name:
        continue
    
    daiyah_list.append({
        "id": f"DAIYAH-{idx+1}",
        "fullName": name,
        "nationality": clean_str(row.iloc[2]) or "يمني",
        "birthdate": clean_date_str(row.iloc[3]),
        "governorate": clean_str(row.iloc[4]) or "تعز",
        "city": clean_str(row.iloc[5]) or "تعز",
        "nationalId": clean_str(row.iloc[6]),
        "qualification": clean_str(row.iloc[7]),
        "specialization": clean_str(row.iloc[8]),
        "certificates": clean_str(row.iloc[9]),
        "quranMemorization": clean_str(row.iloc[10]) or "القرآن كاملاً",
        "healthStatus": clean_str(row.iloc[11]) or "سليم",
        "notes": clean_str(row.iloc[12]),
        "sponsor": "جمعية الصفا الخيرية - الكويت"
    })

# 2. Parse Memorizers (الحُفّاظ)
df_h = pd.read_excel(file_huffaz, sheet_name="رابعة2024")
huffaz_list = []

for idx in range(0, len(df_h)):
    row = df_h.iloc[idx]
    name = clean_str(row.iloc[8])
    if not name or "الاسم" in name or name == "NaN":
        continue
        
    project_no = clean_str(row.iloc[4])
    mumaiyo = clean_str(row.iloc[5])
    saudi_account = clean_str(row.iloc[6])
    
    gender_raw = clean_str(row.iloc[9])
    gender_mapped = "FEMALE" if gender_raw and ("أنثى" in gender_raw or "انثى" in gender_raw or "FEMALE" in gender_raw.upper()) else "MALE"
    
    nationality = clean_str(row.iloc[10]) or "يمني"
    siblings_count = clean_str(row.iloc[11])
    birthdate = clean_date_str(row.iloc[12])
    country = clean_str(row.iloc[13]) or "اليمن"
    gov = clean_str(row.iloc[14]) or "تعز"
    national_id = clean_str(row.iloc[15])
    city = clean_str(row.iloc[16]) or "تعز"
    district = clean_str(row.iloc[17]) or "صالة"
    village = clean_str(row.iloc[18])
    
    edu_stage = clean_str(row.iloc[19])
    grade = clean_str(row.iloc[20])
    grade_eval = clean_str(row.iloc[21])
    
    quran_memorized = clean_str(row.iloc[22])
    quran_to = clean_str(row.iloc[23])
    memorization_level = clean_str(row.iloc[24])
    
    psychological_status = clean_str(row.iloc[25]) or "ممتازة"
    health_status = clean_str(row.iloc[26]) or "سليمة"
    employment_status = clean_str(row.iloc[27])
    occupation = clean_str(row.iloc[28]) or "طالب"
    school_uni = clean_str(row.iloc[29])
    
    quran_circle = clean_str(row.iloc[30])
    quran_center = clean_str(row.iloc[31])
    join_date = clean_date_str(row.iloc[32])
    specialization = clean_str(row.iloc[33])
    
    phone = clean_str(row.iloc[34]) if len(row) > 34 else None
    
    huffaz_list.append({
        "id": f"HAFIZ-{len(huffaz_list)+1}",
        "fullName": name,
        "projectNo": project_no,
        "mumaiyo": mumaiyo,
        "saudiAccount": saudi_account,
        "gender": gender_mapped,
        "nationality": nationality,
        "siblingsCount": siblings_count,
        "birthdate": birthdate,
        "country": country,
        "governorate": gov,
        "district": district,
        "city": city,
        "village": village,
        "nationalId": national_id,
        "educationalStage": edu_stage,
        "grade": grade,
        "gradeEvaluation": grade_eval,
        "quranMemorized": quran_memorized,
        "quranTo": quran_to,
        "memorizationLevel": memorization_level,
        "psychologicalStatus": psychological_status,
        "healthStatus": health_status,
        "employmentStatus": employment_status,
        "occupation": occupation,
        "schoolOrUniversity": school_uni,
        "quranCircle": quran_circle,
        "quranCenter": quran_center,
        "joinDate": join_date,
        "specialization": specialization,
        "phoneNumber": phone,
        "sponsor": "جمعية الصفا الخيرية - الكويت"
    })

# 3. Parse Teachers (المحفّظين)
df_m = pd.read_excel(file_muhaffiz, sheet_name="ورقة2")
muhaffiz_list = []

for idx in range(0, len(df_m)):
    row = df_m.iloc[idx]
    name = clean_str(row.iloc[1])
    if not name or "الاسم" in name or name == "NaN":
        continue
        
    gender_raw = clean_str(row.iloc[3])
    gender_mapped = "FEMALE" if gender_raw and ("أنثى" in gender_raw or "انثى" in gender_raw or "FEMALE" in gender_raw.upper()) else "MALE"
    
    nationality = clean_str(row.iloc[4]) or "يمني"
    birthdate = clean_date_str(row.iloc[5])
    country = clean_str(row.iloc[6]) or "اليمن"
    gov = clean_str(row.iloc[7]) or "تعز"
    national_id = clean_str(row.iloc[8])
    city = clean_str(row.iloc[9]) or "تعز"
    village = clean_str(row.iloc[10])
    
    uni_qualification = clean_str(row.iloc[11])
    quran_memorization = clean_str(row.iloc[12]) or "القرآن كاملاً"
    riwayat_count = clean_str(row.iloc[13])
    
    psychological_status = clean_str(row.iloc[14]) or "ممتازة"
    health_status = clean_str(row.iloc[15]) or "ممتازة"
    edu_qualification = clean_str(row.iloc[16])
    social_status = clean_str(row.iloc[17])
    
    monthly_circles = clean_str(row.iloc[18])
    circle_address = clean_str(row.iloc[19])
    
    muhaffiz_list.append({
        "id": f"TEACHER-{len(muhaffiz_list)+1}",
        "fullName": name,
        "gender": gender_mapped,
        "nationality": nationality,
        "birthdate": birthdate,
        "country": country,
        "governorate": gov,
        "city": city,
        "village": village,
        "nationalId": national_id,
        "universityQualification": uni_qualification,
        "quranMemorization": quran_memorization,
        "riwayatCount": riwayat_count,
        "psychologicalStatus": psychological_status,
        "healthStatus": health_status,
        "educationalQualification": edu_qualification,
        "socialStatus": social_status,
        "monthlyCirclesCount": monthly_circles,
        "circleLocation": circle_address,
        "sponsor": "جمعية الصفا الخيرية - الكويت"
    })

output_data = {
    "daiyah": daiyah_list,
    "huffaz": huffaz_list,
    "muhaffiz": muhaffiz_list,
    "summary": {
        "daiyah_count": len(daiyah_list),
        "huffaz_count": len(huffaz_list),
        "muhaffiz_count": len(muhaffiz_list),
        "sponsor": "جمعية الصفا الخيرية - الكويت"
    }
}

with open(out_json, "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print("PARSED_SUCCESSFULLY")
