import { QuranProgramClient } from "./quran-program-client"
import safaData from "@/data/safa_program_parsed.json"

export default function QuranProgramPage() {
  return <QuranProgramClient initialData={safaData as any} />
}
