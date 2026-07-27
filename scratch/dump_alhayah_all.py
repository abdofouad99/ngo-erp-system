import pandas as pd

file_path = r"C:\Users\my computer\Downloads\بيانات الحياة - ٣ أسر  .xlsx"
excel_file = pd.ExcelFile(file_path)

out = []
for sheet in excel_file.sheet_names:
    df = pd.read_excel(file_path, sheet_name=sheet)
    out.append(f"\n================ SHEET: '{sheet}' (Rows: {len(df)}) ================")
    out.append(df.to_string())

with open(r"F:\Food management system for the organization\scratch\alhayah_full_rows.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))

print("ALL_ROWS_SAVED")
