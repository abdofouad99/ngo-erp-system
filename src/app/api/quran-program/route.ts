import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const scratchJsonPath = "C:\\Users\\my computer\\.gemini\\antigravity\\brain\\b1f67750-12b1-4ef0-90a2-b46de15cbea6\\scratch\\safa_program_parsed.json"

export async function GET() {
  try {
    if (!fs.existsSync(scratchJsonPath)) {
      return NextResponse.json({
        summary: { daiyah_count: 0, huffaz_count: 0, muhaffiz_count: 0, sponsor: "جمعية الصفا الخيرية - الكويت" },
        huffaz: [],
        muhaffiz: [],
        daiyah: []
      })
    }

    const fileContent = fs.readFileSync(scratchJsonPath, "utf-8")
    const data = JSON.parse(fileContent)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error reading Safa Quran Program data:", error)
    return NextResponse.json({ error: "Failed to fetch Quran Program data" }, { status: 500 })
  }
}
