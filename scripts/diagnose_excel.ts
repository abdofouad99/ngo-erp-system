import * as XLSX from "xlsx"

const filePath = "C:\\Users\\my computer\\Downloads\\كشف بيانات الايتام كامل .xlsx"
const workbook = XLSX.readFile(filePath)
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][]

// Count rows with data in column 20 (اليتيم)
let countWithName = 0
let countTotal = 0
let emptyNameRows: number[] = []
let sampleEmptyRows: any[] = []

for (let i = 3; i < rawData.length; i++) {
  const row = rawData[i]
  countTotal++
  if (row[20] !== null && row[20] !== undefined && String(row[20]).trim() !== "") {
    countWithName++
  } else {
    emptyNameRows.push(i + 1)
    if (sampleEmptyRows.length < 5) {
      // show what's in this row
      const nonNull = row.filter((v: any) => v !== null && v !== undefined)
      sampleEmptyRows.push({ rowIndex: i + 1, nonNullCount: nonNull.length, sample: row.slice(0, 10) })
    }
  }
}

console.log(`Total data rows (after header): ${countTotal}`)
console.log(`Rows WITH name in col 20: ${countWithName}`)
console.log(`Rows WITHOUT name in col 20: ${emptyNameRows.length}`)
console.log(`\nSample empty rows:`)
sampleEmptyRows.forEach(r => console.log(JSON.stringify(r, null, 2)))
