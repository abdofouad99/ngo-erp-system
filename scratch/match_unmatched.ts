import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

const unmatched = [
  "احمد نايف علي احمد صالح الانسي",
  "امير محمد عبد حزام مقبل",
  "تركياء حسين صالح عامر ابوشايع",
  "جنات حامس احمد محمد المصقري",
  "شذى حامس احمد محمد المصقري",
  "عمر طلال احمد محمد عبد الوهاب بشر",
  "غلاء عبده محمد احمد محمد سعيد",
  "ليلئ ردفان احمد عبده قائد الجابري",
  "ليناء خالد أحمد صالح مزروع",
  "مجاهد فواد احمد صالح",
  "ياسمين محيي الدين علي حميد العباسي"
]

function normalizeName(name: string): string {
  if (!name) return ""
  return name
    .trim()
    .replace(/[أإآآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْ]/g, "") // remove diacritics
    .replace(/\s+/g, "") // remove all spaces
}

async function main() {
  const orphans = await prisma.beneficiary.findMany({
    where: { category: "ORPHAN", deletedAt: null },
    select: { fullName: true }
  })

  console.log("Searching for closest DB names for unmatched folders:")
  for (const name of unmatched) {
    const normName = normalizeName(name)
    const firstWord = name.split(" ")[0]
    
    // Find orphans starting with the same first word
    const candidates = orphans.filter(o => o.fullName.startsWith(firstWord))
    
    console.log(`\nFolder: "${name}"`)
    if (candidates.length === 0) {
      console.log("  No candidates starting with same first word.")
    } else {
      console.log("  Candidates:")
      for (const c of candidates) {
        const normC = normalizeName(c.fullName)
        console.log(`    - "${c.fullName}" (Normalized: ${normC})`)
      }
    }
  }
}

main().then(() => prisma.$disconnect())
