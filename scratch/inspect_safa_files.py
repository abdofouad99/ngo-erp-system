import pandas as pd
import json

file1 = r"C:\Users\my computer\Downloads\قاعدة بيانات داعية - الصفا.xlsx"
file2 = r"C:\Users\my computer\Downloads\قاعدة بيانات الحفاظ - الصفا.xlsx"
file3 = r"C:\Users\my computer\Downloads\قاعدة بيانات محفظ - الصفا .xlsx"

out_file = r"C:\Users\my computer\.gemini\antigravity\brain\b1f67750-12b1-4ef0-90a2-b46de15cbea6\scratch\safa_files_analysis.txt"

files = [
    ("داعية (Preachers)", file1),
    ("الحفاظ (Quran Memorizers)", file2),
    ("محفظ (Quran Teachers)", file3),
]

with open(out_file, "w", encoding="utf-8") as f:
    for title, fpath in files:
        f.write(f"==================================================\n")
        f.write(f"📁 FILE: {title}\n")
        f.write(f"Path: {fpath}\n")
        f.write(f"==================================================\n")
        try:
            xl = pd.ExcelFile(fpath)
            f.write(f"Sheet Names: {xl.sheet_names}\n\n")
            for sheet in xl.sheet_names:
                df = xl.parse(sheet)
                f.write(f"--- Sheet: {sheet} (Rows: {len(df)}, Cols: {len(df.columns)}) ---\n")
                f.write("Columns:\n")
                for idx, col in enumerate(df.columns):
                    f.write(f"  Col {idx}: {col}\n")
                f.write("\nTop 5 Rows:\n")
                f.write(df.head(5).to_string())
                f.write("\n\n")
        except Exception as e:
            f.write(f"Error reading file: {e}\n\n")

print("Analysis of Safa files written to safa_files_analysis.txt")
