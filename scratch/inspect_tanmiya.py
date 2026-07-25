import pandas as pd
import json

file_path = r"C:\Users\my computer\Downloads\ايتام تنمية الخيرية عدد 25 يتيم.xlsx"
out_file = r"C:\Users\my computer\.gemini\antigravity\brain\b1f67750-12b1-4ef0-90a2-b46de15cbea6\scratch\tanmiya_analysis.txt"

with open(out_file, "w", encoding="utf-8") as f:
    xl = pd.ExcelFile(file_path)
    f.write(f"Sheet Names: {xl.sheet_names}\n\n")

    for sheet in xl.sheet_names:
        df = xl.parse(sheet)
        f.write(f"=== Sheet: {sheet} (Total Rows: {len(df)}, Total Cols: {len(df.columns)}) ===\n")
        f.write("Columns:\n")
        for idx, col in enumerate(df.columns):
            f.write(f"  Col {idx}: {col}\n")
        
        f.write("\nTop 10 Rows:\n")
        f.write(df.head(10).to_string())
        f.write("\n\n" + "="*50 + "\n\n")

print("Analysis of Tanmiya written to tanmiya_analysis.txt")
