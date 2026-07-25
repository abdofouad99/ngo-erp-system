import { NextResponse } from "next/server"
import safaData from "@/data/safa_program_parsed.json"

export async function GET() {
  return NextResponse.json(safaData)
}
