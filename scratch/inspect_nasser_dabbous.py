import pandas as pd
import json

file_path = r"C:\Users\my computer\Downloads\محدث كشف الأسر المستفيدة من مشروع كفالة الأسر المتعففة - 2025 - ناصر الدبوس تنمية (1)_٠٧٥٠٥٥.xlsx"

excel_file = pd.ExcelFile(file_path)
print("Sheet Names:", excel_file.sheet_names)

out = []
out.append(f"Sheet Names: {excel_file.sheet_names}\n")

for sheet in excel_file.sheet_names:
    df = pd.read_excel(file_path, sheet_name=sheet)
    out.append(f"=== Sheet: {sheet} (Rows: {len(df)}, Cols: {len(df.columns)}) ===")
    out.append(f"Raw Columns: {list(df.columns)}")
    out.append("First 5 rows:")
    for idx, row in df.head(5).iterrows():
        out.append(f"Row {idx}: {row.to_dict()}")
    out.append("\n" + "="*50 + "\n")

out_path = r"F:\Food management system for the organization\scratch\nasser_dabbous_analysis.txt"
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(out))

print("INSPECTION_SAVED_SUCCESSFULLY")
