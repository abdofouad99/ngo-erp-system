import pandas as pd
import json

file_path = r"H:\ملفات ايتام النجاة  للدفعه حتى ديسمبر 2025 - عدد  268\كشف صرف  كفالات ايتام النجاة للدفعة حتى ديسمبر2025 الاخير (2).xlsx"

excel_file = pd.ExcelFile(file_path)
print("Sheet Names:", excel_file.sheet_names)

for sheet in excel_file.sheet_names:
    df = pd.read_excel(file_path, sheet_name=sheet)
    print(f"\n--- Sheet: {sheet} ---")
    print("Shape:", df.shape)
    print("Columns:", list(df.columns))
    print("\nFirst 3 rows:")
    print(df.head(3).to_dict(orient="records"))
