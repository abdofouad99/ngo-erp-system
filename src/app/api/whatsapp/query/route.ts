import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOrphanUpdateToken } from "@/app/actions/update-request-actions"

// دالة لتنظيف أرقام الهواتف واستخراج آخر 9 أرقام (التنسيق اليمني القياسي للهاتف المحمول)
function getLast9Digits(phone: string) {
  if (!phone) return ""
  const cleaned = phone.replace(/\D/g, "")
  return cleaned.slice(-9)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone, action, code } = body

    if (!phone) {
      return NextResponse.json({ success: false, error: "رقم الهاتف مطلوب" }, { status: 400 })
    }

    const targetPhone = getLast9Digits(phone)
    if (!targetPhone) {
      return NextResponse.json({ success: false, error: "تنسيق رقم الهاتف غير صالح" }, { status: 400 })
    }

    // 1. الاستعلام عن الأيتام المكفولين المرتبطين بالرقم تلقائياً
    if (action === "query-by-phone") {
      const guardians = await prisma.guardian.findMany({
        where: {
          OR: [
            { phone1: { endsWith: targetPhone } },
            { phone2: { endsWith: targetPhone } },
            { phone3: { endsWith: targetPhone } },
            { phone4: { endsWith: targetPhone } },
          ]
        },
        include: {
          beneficiary: {
            select: {
              fullName: true,
              orphanCode: true,
              verificationStatus: true,
              sponsorships: {
                select: {
                  status: true
                }
              }
            }
          }
        }
      })

      if (guardians.length === 0) {
        return NextResponse.json({
          success: true,
          found: false,
          message: "لم نجد أي يتيم مرتبط برقم هاتفك في قاعدة البيانات. يرجى الاستعلام برقم الملف (الكود) أو التواصل مع الإدارة."
        })
      }

      // تجميع الأيتام بدون تكرار
      const uniqueOrphans = Array.from(
        new Map(guardians.map(g => [g.beneficiary.orphanCode, g.beneficiary])).values()
      )

      const list = uniqueOrphans.map((orphan, idx) => {
        const hasActiveSponsorship = orphan.sponsorships.some(s => s.status === "ACTIVE")
        const sponsorText = hasActiveSponsorship ? "مكفول نشط ✅" : "بانتظار كفالة ⏳"
        const statusText = orphan.verificationStatus === "APPROVED" 
          ? "ملف مكتمل ومعتمد" 
          : orphan.verificationStatus === "REJECTED" 
            ? "ملف مرفوض وبانتظار التعديل" 
            : "قيد المراجعة والتحقق"

        return `${idx + 1}️⃣ *${orphan.fullName}*\n   - كود اليتيم: \`${orphan.orphanCode || "بدون"}\`\n   - حالة الكفالة: *${sponsorText}*\n   - حالة الملف: *${statusText}*`
      }).join("\n\n")

      return NextResponse.json({
        success: true,
        found: true,
        message: `تم العثور على الأيتام التاليين المرتبطين برقم هاتفك:\n\n${list}`
      })
    }

    // 2. الاستعلام عن يتيم برقم الملف (الكود)
    if (action === "query-by-code") {
      if (!code) {
        return NextResponse.json({ success: false, error: "كود اليتيم مطلوب" }, { status: 400 })
      }

      const orphan = await prisma.beneficiary.findFirst({
        where: {
          orphanCode: {
            equals: code.trim(),
            mode: "insensitive"
          },
          deletedAt: null
        },
        select: {
          fullName: true,
          orphanCode: true,
          verificationStatus: true,
          sponsorships: {
            select: {
              status: true
            }
          }
        }
      })

      if (!orphan) {
        return NextResponse.json({
          success: true,
          found: false,
          message: `❌ عذراً، لم نجد أي يتيم مسجل بكود الملف: *${code}*.\nيرجى التأكد من كتابة الكود بشكل صحيح (مثال: \`2025-0123\`).`
        })
      }

      const hasActiveSponsorship = orphan.sponsorships.some(s => s.status === "ACTIVE")
      const sponsorText = hasActiveSponsorship ? "مكفول نشط ✅" : "بانتظار كفالة ⏳"
      const statusText = orphan.verificationStatus === "APPROVED" 
        ? "ملف مكتمل ومعتمد" 
        : orphan.verificationStatus === "REJECTED" 
          ? "ملف مرفوض وبانتظار التعديل" 
          : "قيد المراجعة والتحقق"

      return NextResponse.json({
        success: true,
        found: true,
        message: `📋 *تفاصيل اليتيم المستعلم عنه:*\n\nالاسم: *${orphan.fullName}*\nكود الملف: \`${orphan.orphanCode}\`\nحالة الكفالة: *${sponsorText}*\nحالة الملف: *${statusText}*`
      })
    }

    // 3. الحصول على رابط تحديث البيانات تلقائياً
    if (action === "generate-token") {
      const guardians = await prisma.guardian.findMany({
        where: {
          OR: [
            { phone1: { endsWith: targetPhone } },
            { phone2: { endsWith: targetPhone } },
            { phone3: { endsWith: targetPhone } },
            { phone4: { endsWith: targetPhone } },
          ]
        },
        select: {
          beneficiaryId: true,
          beneficiary: {
            select: {
              fullName: true
            }
          }
        }
      })

      if (guardians.length === 0) {
        return NextResponse.json({
          success: true,
          found: false,
          message: "عذراً، رقم هاتفك غير مرتبط بأي يتيم مسجل في نظامنا. للحصول على رابط التحديث، يرجى التحدث مع المسؤول لتسجيل رقمك أولاً."
        })
      }

      // إزالة المكررين
      const uniqueBeneficiaryIds = Array.from(new Set(guardians.map(g => g.beneficiaryId)))
      const linksList = []

      for (const bId of uniqueBeneficiaryIds) {
        const guardianData = guardians.find(g => g.beneficiaryId === bId)
        const name = guardianData?.beneficiary.fullName || "يتيم"
        const tokenRes = await generateOrphanUpdateToken(bId)
        if (tokenRes.success && tokenRes.url) {
          linksList.push(`🔗 *رابط تحديث بيانات اليتيم ${name}:*\n${tokenRes.url}`)
        }
      }

      const listText = linksList.join("\n\n")
      return NextResponse.json({
        success: true,
        found: true,
        message: `مرحباً، إليك روابط تحديث البيانات الخاصة بك:\n\n${listText}\n\nيرجى فتح الرابط وتعديل وتحديث البيانات المطلوبة.`
      })
    }

    return NextResponse.json({ success: false, error: "الإجراء المطلوب غير صالح" }, { status: 400 })

  } catch (error: any) {
    console.error("API error in whatsapp query:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
