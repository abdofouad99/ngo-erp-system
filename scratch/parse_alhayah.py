import pandas as pd
import json

file_path = r"C:\Users\my computer\Downloads\بيانات الحياة - ٣ أسر  .xlsx"

excel_file = pd.ExcelFile(file_path)
sheet_names = excel_file.sheet_names
print("Sheet Names:", sheet_names)

# Parse Families Sheet by index
df_fam = pd.read_excel(file_path, sheet_name=sheet_names[2])

families = []
current_fam = None

for idx, row in df_fam.iterrows():
    head_name = row.get('اسم عائل الاسرة الرباعي ')
    
    # Skip header row
    if idx == 0:
        continue
        
    if pd.notna(head_name) and str(head_name).strip() != '':
        head_name_clean = str(head_name).strip()
        current_fam = {
            "headName": head_name_clean,
            "headRole": str(row.get('نوعه / الام- الاب', '')).strip() if pd.notna(row.get('نوعه / الام- الاب')) else "الأم",
            "nationality": str(row.get('الجنسية ', '')).strip() if pd.notna(row.get('الجنسية ')) else "اليمن",
            "housingType": str(row.get('نوع السكن ', '')).strip() if pd.notna(row.get('نوع السكن ')) else "إيجار",
            "rentAmount": str(row.get('قيمة ايجار السكن', '')).strip() if pd.notna(row.get('قيمة ايجار السكن')) else "",
            "phone": str(int(float(row.get('رقم الهاتف')))) if pd.notna(row.get('رقم الهاتف')) and str(row.get('رقم الهاتف')).strip() != '' else "",
            "address": str(row.get('العنوان ', '')).strip() if pd.notna(row.get('العنوان ')) else "",
            "statusSummary": str(row.get('نبذة عن حلة الاسرة ', '')).strip() if pd.notna(row.get('نبذة عن حلة الاسرة ')) else "",
            "members": []
        }
        families.append(current_fam)
        
    # Check if row has member data
    member_name = row.get('افراد الاسرة / لكل فرد الاسم. تاريخ ميلاده . الصله . لمرحلة الدراسية ')
    if current_fam and pd.notna(member_name) and str(member_name).strip() not in ['', 'الاسم ']:
        birth_year = row.get('Unnamed: 6')
        relation = row.get('Unnamed: 7')
        education_stage = row.get('Unnamed: 8')
        
        current_fam["members"].append({
            "name": str(member_name).strip(),
            "birthYear": int(birth_year) if pd.notna(birth_year) and str(birth_year).isdigit() else str(birth_year) if pd.notna(birth_year) else "",
            "relation": str(relation).strip() if pd.notna(relation) else "",
            "educationStage": str(education_stage).strip() if pd.notna(education_stage) else ""
        })

# Parse Widows Sheet by index
df_widows = pd.read_excel(file_path, sheet_name=sheet_names[1])
widows = []
for idx, row in df_widows.iterrows():
    w_name = row.get('اسم الارملة الرباعي ')
    if pd.notna(w_name) and str(w_name).strip() != '':
        widows.append({
            "name": str(w_name).strip()
        })

data = {
    "sponsor": "مؤسسة الحياة الخيرية",
    "totalFamilies": len(families),
    "totalMembers": sum(len(f["members"]) for f in families),
    "totalWidows": len(widows),
    "families": families,
    "widows": widows
}

with open(r"F:\Food management system for the organization\scratch\alhayah_parsed.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open(r"F:\Food management system for the organization\src\data\alhayah_parsed.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("PARSED_SUCCESSFULLY:", json.dumps({
    "totalFamilies": len(families),
    "totalMembers": sum(len(f["members"]) for f in families),
    "totalWidows": len(widows)
}, ensure_ascii=False))
