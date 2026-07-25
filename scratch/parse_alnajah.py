import pandas as pd
import json
import os

file_path = r"H:\ملفات ايتام النجاة  للدفعه حتى ديسمبر 2025 - عدد  268\كشف صرف  كفالات ايتام النجاة للدفعة حتى ديسمبر2025 الاخير (2).xlsx"

excel = pd.ExcelFile(file_path)
sheet_names = excel.sheet_names

out = []
out.append(f"Sheet Names in file: {sheet_names}\n")

for sheet in sheet_names:
    df = pd.read_excel(file_path, sheet_name=sheet)
    out.append(f"=== Sheet: {sheet} (Rows: {len(df)}, Cols: {len(df.columns)}) ===")
    out.append(f"Columns: {list(df.columns)}")
    
    # Save first 5 rows raw string representation
    out.append("First 5 rows:")
    for idx, row in df.head(5).iterrows():
        out.append(f"Row {idx}: {row.to_dict()}")
    out.append("\n" + "="*50 + "\n")

with open(r"F:\Food management system for the organization\scratch\alnajah_analysis.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))

print("ANALYSIS_SAVED_SUCCESSFULLY")
