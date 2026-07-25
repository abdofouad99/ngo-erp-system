import fs from "fs"
import path from "path"
import { QuranProgramClient } from "./quran-program-client"

const scratchJsonPath = "C:\\Users\\my computer\\.gemini\\antigravity\\brain\\b1f67750-12b1-4ef0-90a2-b46de15cbea6\\scratch\\safa_program_parsed.json"

export default async function QuranProgramPage() {
  let initialData = {
    summary: { daiyah_count: 2, huffaz_count: 102, muhaffiz_count: 1, sponsor: "جمعية الصفا الخيرية - الكويت" },
    huffaz: [],
    muhaffiz: [],
    daiyah: []
  }

  try {
    if (fs.existsSync(scratchJsonPath)) {
      const content = fs.readFileSync(scratchJsonPath, "utf-8")
      initialData = JSON.parse(content)
    }
  } catch (error) {
    console.error("Error reading Safa Quran Program data:", error)
  }

  return <QuranProgramClient initialData={initialData} />
}
