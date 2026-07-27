import re
import os

files_to_fix = [
    r"F:\Food management system for the organization\src\components\dashboard\dashboard-charts.tsx",
    r"F:\Food management system for the organization\src\app\(dashboard)\dashboard\families\families-client.tsx",
    r"F:\Food management system for the organization\src\app\(dashboard)\dashboard\orphans\orphans-client.tsx",
    r"F:\Food management system for the organization\src\app\(dashboard)\dashboard\projects\projects-client.tsx",
    r"F:\Food management system for the organization\src\app\(dashboard)\dashboard\reports\reports-client.tsx",
    r"F:\Food management system for the organization\src\app\(dashboard)\dashboard\patients\patients-client.tsx",
    r"F:\Food management system for the organization\src\app\(dashboard)\dashboard\quran-program\quran-program-client.tsx",
    r"F:\Food management system for the organization\src\app\(dashboard)\dashboard\data-quality\data-quality-client.tsx",
    r"F:\Food management system for the organization\src\app\(dashboard)\dashboard\targeting\targeting-client.tsx",
]

replacements = [
    # Select boxes in dark backgrounds without light mode
    (r'className="([^"]*?)bg-slate-900/90 border border-slate-700/80([^"]*?)"',
     r'className="\1bg-gray-50 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700/80 text-gray-800 dark:text-slate-200\2"'),
    (r'className="([^"]*?)bg-slate-900/50 border border-slate-800/80([^"]*?)"',
     r'className="\1bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800/80 text-gray-800 dark:text-slate-200\2"'),
    
    # Standalone table headers / cells
    (r'bg-slate-950 text-slate-200', r'bg-gray-50 dark:bg-slate-950 text-gray-700 dark:text-slate-200'),
    (r'bg-slate-900/80 border-b border-slate-800', r'bg-gray-100 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-800'),
    (r'bg-slate-900/40', r'bg-gray-50/50 dark:bg-slate-900/40'),
    (r'bg-slate-950/30', r'bg-white dark:bg-slate-950/30'),
    (r'bg-slate-950/40', r'bg-white dark:bg-slate-950/40'),

    # Labels and icons text
    (r'text-slate-400 font-bold', r'text-gray-500 dark:text-slate-400 font-bold'),
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        print(f"Skipping (not found): {file_path}")
        continue

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # Fix selects bg-slate-900 without light mode
    content = content.replace(
        'className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2',
        'className="w-full bg-gray-50 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2'
    )
    
    # Fix option tags background
    content = content.replace('className="bg-slate-950 text-white"', 'className="bg-white dark:bg-slate-950 text-gray-900 dark:text-white"')

    if content != original:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated: {os.path.basename(file_path)}")
    else:
        print(f"No regex match needed for: {os.path.basename(file_path)}")

print("Done light-dark script!")
