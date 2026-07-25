import pandas as pd
import json

file_path = r"C:\Users\my computer\Downloads\قاعدة ايتام الزكاة محدث 23-7-2026.xlsx"
out_file = r"C:\Users\my computer\.gemini\antigravity\brain\b1f67750-12b1-4ef0-90a2-b46de15cbea6\scratch\zakat_2026_analysis.txt"

with open(out_file, "w", encoding="utf-8") as f:
    xl = pd.ExcelFile(file_path)
    f.write(f"Sheet Names: {xl.sheet_names}\n\n")

    for sheet in xl.sheet_names:
        df = xl.parse(sheet)
        f.write(f"=== Sheet: {sheet} (Total Rows: {len(df)}, Total Cols: {len(df.columns)}) ===\n")
        f.write("Columns:\n")
        for idx, col in enumerate(df.columns):
            f.write(f"  Col {idx}: {col}\n")
        
        f.write("\nTop 5 Rows:\n")
        f.write(df.head(5).to_string())
        f.write("\n\n" + "="*50 + "\n\n")

print("Done writing analysis to zakat_2026_analysis.txt")
