import json

json_path = r"C:\Users\my computer\.gemini\antigravity\brain\b1f67750-12b1-4ef0-90a2-b46de15cbea6\scratch\zakat_2026_parsed.json"
out_json_path = r"C:\Users\my computer\.gemini\antigravity\brain\b1f67750-12b1-4ef0-90a2-b46de15cbea6\scratch\audit_report.json"

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

orphans = data["orphans"]
families = data["families"]

total_orphans = len(orphans)
total_families = len(families)

fields_to_check = [
    ("fullName", "اسم اليتيم"),
    ("orphanCode", "كود اليتيم (بيت الزكاة)"),
    ("kuraimiAccount", "رقم حساب الكريمي"),
    ("mumaiyo", "رقم المميز"),
    ("birthdate", "تاريخ الميلاد"),
    ("educationalStage", "المرحلة الدراسية"),
    ("schoolName", "اسم المدرسة"),
    ("educationLevel", "الصف الدراسي"),
    ("notes", "مستوى حفظ القرآن"),
    ("motherName", "اسم الأم"),
    ("fatherDeathDate", "تاريخ وفاة الأب"),
    ("fatherDeathCause", "سبب وفاة الأب"),
    ("healthStatus", "الحالة الصحية"),
]

orphan_stats = {}
for field, label in fields_to_check:
    count = sum(1 for o in orphans if o.get(field) and str(o.get(field)).strip() not in ['', 'None', 'null'])
    pct = (count / total_orphans) * 100
    orphan_stats[label] = {
        "count": count,
        "missing": total_orphans - count,
        "pct": round(pct, 1)
    }

fam_fields = [
    ("headFullName", "اسم المعيل"),
    ("headPhoneNumber", "رقم الهاتف الأساسي"),
    ("headAltPhone", "رقم الهاتف الثانوي"),
    ("addressDetail", "العنوان التفصيلي"),
    ("governorate", "المحافظة"),
    ("district", "المديرية"),
    ("subDistrict", "العزلة"),
]

fam_stats = {}
for field, label in fam_fields:
    count = sum(1 for f in families if f.get(field) and str(f.get(field)).strip() not in ['', 'None', 'null'])
    pct = (count / total_families) * 100
    fam_stats[label] = {
        "count": count,
        "missing": total_families - count,
        "pct": round(pct, 1)
    }

out_report = {
    "total_orphans": total_orphans,
    "total_families": total_families,
    "orphan_stats": orphan_stats,
    "fam_stats": fam_stats
}

with open(out_json_path, "w", encoding="utf-8") as f:
    json.dump(out_report, f, ensure_ascii=False, indent=2)

print("Audit finished successfully.")
