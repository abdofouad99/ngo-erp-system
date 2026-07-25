import pandas as pd
import json

file_path = r"C:\Users\my computer\Downloads\محدث كشف الأسر المستفيدة من مشروع كفالة الأسر المتعففة - 2025 - ناصر الدبوس تنمية (1)_٠٧٥٠٥٥.xlsx"

df = pd.read_excel(file_path, sheet_name="ورقة1")

families = []

for idx, row in df.iterrows():
    name = str(row.get('الاسم', '')).strip()
    if not name or name == 'nan' or 'إجمالي' in name or 'م' == name:
        continue
    
    m_code = str(row.get('م', '')).strip()
    id_type = str(row.get('نوع البطاقة', '')).strip()
    id_num = str(row.get('رقم البطاقة', '')).strip()
    phone = str(row.get('رقم التلفون ', '')).strip()
    if phone == 'nan':
        phone = str(row.get('رقم التلفون', '')).strip()
        
    reason = str(row.get('سبب الاعاله ', '')).strip()
    if reason == 'nan':
        reason = str(row.get('سبب الاعاله', '')).strip()
        
    district = str(row.get('المديرية', '')).strip()
    address = str(row.get('العنوان', '')).strip()
    members_count = str(row.get('عدد الافراد', '')).strip()
    saudi_acc = str(row.get('رقم الحساب السعودي في بنك الكريمي', '')).strip()
    id_card_status = str(row.get('البطائق', '')).strip()

    fam_rec = {
        "m_code": m_code if m_code != 'nan' else None,
        "fullName": name,
        "idType": id_type if id_type != 'nan' else "شخصية",
        "nationalId": id_num if id_num != 'nan' else None,
        "phone": phone if phone != 'nan' and phone != '0.0' else None,
        "supportReason": reason if reason != 'nan' else "أسرة متعففة",
        "district": district if district != 'nan' else "المدينة",
        "address": address if address != 'nan' else "تعز",
        "membersCount": members_count if members_count != 'nan' else "5",
        "saudiAccount": saudi_acc if saudi_acc != 'nan' else None,
        "idCardStatus": id_card_status if id_card_status != 'nan' else "مرفق",
        "project": "مشروع كفالة الأسر المتعففة 2025 - ناصر الدبوس",
        "sponsor": "جمعية تنمية الخيرية (ناصر الدبوس)"
    }
    families.append(fam_rec)

out_data = {
    "summary": {
        "total_families": len(families),
        "sponsor": "جمعية تنمية الخيرية (ناصر الدبوس)",
        "project": "مشروع كفالة الأسر المتعففة - 2025"
    },
    "families": families
}

json_path = r"F:\Food management system for the organization\scratch\nasser_dabbous_parsed.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(out_data, f, ensure_ascii=False, indent=2)

print(f"PARSED_NASSER_DABBOUS_SUCCESSFULLY: {len(families)} families")
