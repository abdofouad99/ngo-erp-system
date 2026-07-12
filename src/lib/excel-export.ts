/**
 * Excel Export Utility
 * Uses SheetJS (xlsx) to export data to Excel files in the browser
 */

import * as XLSX from "xlsx"

// ============================================================
// Generic export function
// ============================================================
export function exportToExcel(data: any[], filename: string, sheetName = "البيانات") {
  const worksheet = XLSX.utils.json_to_sheet(data)

  // Auto-width columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length * 2, 20),
  }))
  worksheet["!cols"] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  XLSX.writeFile(workbook, `${filename}_${new Date().toLocaleDateString("ar-YE-u-nu-latn").replace(/\//g, "-")}.xlsx`)
}

// ============================================================
// Orphans Export
// ============================================================
export function exportOrphansToExcel(orphans: any[]) {
  const data = orphans.map((o, i) => ({
    "#": i + 1,
    "كود الملف": o.orphanCode || "-",
    "اسم اليتيم": o.fullName || "-",
    "الجنس": o.gender === "MALE" ? "ذكر" : "أنثى",
    "تاريخ الميلاد": o.birthdate ? new Date(o.birthdate).toLocaleDateString("ar-YE-u-nu-latn") : "-",
    "نوع اليتيم": o.orphanType === "FATHER" ? "يتيم الأب" : o.orphanType === "MOTHER" ? "يتيم الأم" : o.orphanType === "BOTH" ? "يتيم الأبوين" : "-",
    "الأسرة": o.family?.headFullName || "-",
    "المرحلة الدراسية": o.educationalStage || o.educationLevel || "-",
    "المدرسة": o.schoolName || "-",
    "الحالة الصحية": o.healthStatus || "-",
    "إعاقة": o.disability ? "نعم" : "لا",
    "رقم الكريمي": o.kuraimiAccount || "-",
    "حالة التحقق": o.verificationStatus === "APPROVED" ? "معتمد" : o.verificationStatus === "REJECTED" ? "مرفوض" : "قيد المراجعة",
    "سبب الرفض": o.rejectionReason || "-",
    "ملاحظات": o.notes || "-",
    "تاريخ التسجيل": o.createdAt ? new Date(o.createdAt).toLocaleDateString("ar-YE-u-nu-latn") : "-",
  }))

  exportToExcel(data, "قائمة_الأيتام", "الأيتام")
}

// ============================================================
// Families Export
// ============================================================
export function exportFamiliesToExcel(families: any[]) {
  const data = families.map((f, i) => ({
    "م": i + 1,
    "الاسم الرباعي للزوج": f.headFullName || "-",
    "اللقب": f.headLastName || "-",
    "رقم الهوية": f.headNationalId || "-",
    "نوع الهوية ( شخصية - جواز سفر )": f.headIdType || "-",
    "تاريخ الإصدار": f.headIdIssueDate || "-",
    "مكان الإصدار": f.headIdIssuePlace || "-",
    "تاريخ الميلاد": f.headBirthdate ? new Date(f.headBirthdate).toLocaleDateString("en-GB") : "-",
    "العمر": f.headAge || "-",
    "الجنس ( ذكر - انثى)": f.headGender === "MALE" ? "ذكر" : "أنثى",
    "الحالة الاجتماعية ( متزوج - ارمل - مطلق - متوفي )": f.socialStatus || "-",
    "رقم الجوال الأساسي": f.headPhoneNumber || "-",
    "رقم الجوال البديل": f.headAltPhone || "-",
    "رقم الواتساب ": f.headWhatsApp || "-",
    "المستوى التعليمي ( امي - ابتدائي - متوسط - ثانوية - جامعي -)": f.headEducationLevel || "-",
    "المهنة الحالية": f.headOccupation || "-",
    "اسم الزوجة الرباعي ": f.spouseName || "-",
    "رقم هوية الزوجة": f.spouseIdNumber || "-",
    "نوع الهوية ( شخصية - جواز سفر ) ": f.spouseIdType || "-",
    "تاريخ ميلاد الزوجة": f.spouseBirthdate ? new Date(f.spouseBirthdate).toLocaleDateString("en-GB") : "-",
    "عمر الزوجة": f.spouseAge || "-",
    "المستوى التعليمي للزوجة ( امي - ابتدائي - متوسط - ثانوية - جامعي -)": f.spouseEducationLevel || "-",
    "هل توجد زوجة أخرى؟ ( نعم - لا )": f.hasAnotherSpouse ? "نعم" : "لا",
    "إجمالي عدد أفراد الأسرة ( مع الزوج والزوجة )": f.manualMembersCount || "-",
    "عدد الذكور": f.manualMalesCount || "-",
    "عدد الإناث": f.manualFemalesCount || "-",
    "أطفال (أقل من 5 سنوات)": f.kidsUnder5Count || "-",
    "أطفال (5 - 17 سنة)": f.kids5To17Count || "-",
    "بالغين (18 - 59 سنة)": f.adults18To59Count || "-",
    "كبار السن (60 فما فوق)": f.elderlyAbove60Count || "-",
    "عدد ذوي الاحتياجات الخاصة": f.specialNeedsCount || "-",
    "نوع الإعاقة / المرض المزمن": f.disabilityType || "-",
    "المحافظة": f.subDistrict?.district?.governorate?.nameAr || "-",
    "المديرية": f.subDistrict?.district?.nameAr || "-",
    "العزلة / المنطقة": f.subDistrict?.nameAr || "-",
    "القرية / الحارة": f.addressDetail || "-",
    "أقرب معلم بارز": f.nearestLandmark || "-",
    "نوع السكن ( بيت - شقة  - دكان - خيمة - صندقة )": f.housingType || "-",
    "حالة السكن ( ممتاز - جيد - مقبول - متهالك )": f.housingCondition || "-",
    "الإيجار الشهري (إن وجد)": f.rentAmount || "-",
    "مصدر المياه الرئيسي ( مشروع - وايتات  - سبيل )": f.waterSource || "-",
    "مصدر الإضاءة الرئيسي ( كهرباء  - منظومة شمسية - اشتراك من الجيران )": f.electricitySource || "-",
    "ملاحظات عن السكن ": f.housingNotes || "-",
    "مصدر الدخل الرئيسي": f.notes || "-",
    "متوسط الدخل الشهري": f.monthlyIncome || "-",
    "هل الأسرة تعول أيتام؟": f.hasOrphans ? "نعم" : "لا",
    "عدد الأيتام": f.orphansCount || 0,
    "هل تعول الأسرة أرملة؟": f.hasWidow ? "نعم" : "لا",
    "هل يوجد شخص بلا عمل؟": f.hasUnemployed ? "نعم" : "لا",
    "أهم الاحتياجات الحالية": f.urgentNeeds || "-",
    "تصنيف حالة الفقر ( شديد - متوسط - منخفض )": f.povertyLevel === "SEVERE" ? "شديد" : f.povertyLevel === "MEDIUM" ? "متوسط" : f.povertyLevel === "LOW" ? "منخفض" : "-",
    "هل الأسرة نازحة؟": f.isDisplaced ? "نعم" : "لا",
    "محافظة النزوح": f.displacementGov || "-",
    "مديرية النزوح": f.displacementDist || "-",
    "تاريخ النزوح": f.displacementDate || "-",
    "سبب النزوح": f.displacementReason || "-",
    "هل استلمت مساعدات سابقاً؟ ( نعم - لا)": f.receivedAidBefore ? "نعم" : "لا",
    "نوع المساعدة ( عيني - نقدي -": f.aidType || "-",
    "الجهة المانحة": f.aidDonor || "-",
    "تاريخ آخر مساعدة": f.lastAidDate || "-",
    "طريقة استلام المساعدات المالية": f.deliveryMethod || "-",
    "رقم الحساب في بنك الكريمي الريال اليمني": f.kuraimiAccountYemeni || "-",
    "رقم الحساب في بنك الكريمي الريال السعودي": f.kuraimiAccountSaudi || "-",
    "صورة الهوية ( للزوج والزوجة)": "-",
    "كرت العائلة ( في حال عدم وجود هوية )": "-",
    "تقارير طبية (إن وجدت)": "-",
    "ملاحظات عامة": f.notes || "-",
    "اسم المعرف الرباعي": f.referrerName || "-",
    "صلة القرابة بالمعرف": f.referrerRelation || "-",
  }))

  exportToExcel(data, "سجل_بيانات_الاسر_المستفيدية_الشامل", "تسجيل المستفيدين")
}

// ============================================================
// Sponsors Export
// ============================================================
export function exportSponsorsToExcel(sponsors: any[]) {
  const data = sponsors.map((s, i) => ({
    "#": i + 1,
    "اسم الراعي": s.fullName || "-",
    "المنظمة/الجهة": s.organization || "-",
    "رقم الهوية": s.nationalId || "-",
    "البريد الإلكتروني": s.email || "-",
    "رقم الهاتف": s.phone || "-",
    "الدولة": s.country || "-",
    "عدد الكفالات": s.sponsorships?.length || 0,
    "ملاحظات": s.notes || "-",
    "تاريخ التسجيل": s.createdAt ? new Date(s.createdAt).toLocaleDateString("ar-YE-u-nu-latn") : "-",
  }))

  exportToExcel(data, "قائمة_الرعاة", "الرعاة")
}

// ============================================================
// Sponsorships Export
// ============================================================
export function exportSponsorshipsToExcel(sponsorships: any[]) {
  const data = sponsorships.map((s, i) => ({
    "#": i + 1,
    "الراعي": s.sponsor?.fullName || "-",
    "المستفيد/الأسرة": s.beneficiary?.fullName || s.family?.headFullName || "-",
    "نوع الكفالة": s.beneficiary ? "يتيم" : "أسرة",
    "المبلغ": s.amount || "-",
    "العملة": s.currency || "-",
    "دورة الدفع": s.paymentCycle === "MONTHLY" ? "شهري" : s.paymentCycle === "QUARTERLY" ? "ربع سنوي" : s.paymentCycle === "ANNUAL" ? "سنوي" : s.paymentCycle === "SEMI_ANNUAL" ? "نصف سنوي" : "مرة واحدة",
    "الحالة": s.status === "ACTIVE" ? "نشطة" : s.status === "PAUSED" ? "موقوفة" : "منتهية",
    "تاريخ البدء": s.startDate ? new Date(s.startDate).toLocaleDateString("ar-YE-u-nu-latn") : "-",
    "تاريخ الانتهاء": s.endDate ? new Date(s.endDate).toLocaleDateString("ar-YE-u-nu-latn") : "مفتوحة",
    "دولة الراعي": s.sponsorCountry || s.sponsor?.country || "-",
    "ملاحظات": s.notes || "-",
  }))

  exportToExcel(data, "قائمة_الكفالات", "الكفالات")
}

// ============================================================
// Projects Export  
// ============================================================
export function exportProjectsToExcel(projects: any[]) {
  const data = projects.map((p, i) => ({
    "#": i + 1,
    "اسم المشروع": p.name || "-",
    "الوصف": p.description || "-",
    "الفئة": p.category === "CASH" ? "نقدي" : p.category === "IN_KIND" ? "عيني" : p.category === "TRAINING" ? "تدريب" : p.category === "MEDICAL" ? "طبي" : "أخرى",
    "الحالة": p.status === "ACTIVE" ? "نشط" : p.status === "COMPLETED" ? "مكتمل" : p.status === "DRAFT" ? "مسودة" : p.status === "SUSPENDED" ? "موقوف" : "ملغي",
    "الميزانية": p.budget || "-",
    "العملة": p.currency || "-",
    "العدد المستهدف": p.targetCount || "-",
    "تاريخ البدء": p.startDate ? new Date(p.startDate).toLocaleDateString("ar-YE-u-nu-latn") : "-",
    "تاريخ الانتهاء": p.endDate ? new Date(p.endDate).toLocaleDateString("ar-YE-u-nu-latn") : "-",
    "عدد المستفيدين": p.beneficiaryLinks?.length || 0,
    "تاريخ الإنشاء": p.createdAt ? new Date(p.createdAt).toLocaleDateString("ar-YE-u-nu-latn") : "-",
  }))

  exportToExcel(data, "قائمة_المشاريع", "المشاريع")
}

// ============================================================
// Distributions Export  
// ============================================================
export function exportDistributionsToExcel(distributions: any[]) {
  const data = distributions.map((d, i) => ({
    "#": i + 1,
    "المشروع": d.project?.name || "-",
    "المستفيد المستلم": d.beneficiary?.fullName || "-",
    "رقم الدفعة": d.batchNumber || "-",
    "المادة الموزعة": d.deliveredItem || "-",
    "الكمية": d.quantity || 0,
    "القيمة الفردية": d.unitValue || 0,
    "القيمة الإجمالية": (d.quantity || 0) * (d.unitValue || 0),
    "العملة": d.currency || "-",
    "تم الاستلام": d.isDelivered ? "نعم" : "لا",
    "تاريخ الاستلام": d.deliveryDate ? new Date(d.deliveryDate).toLocaleDateString("ar-YE-u-nu-latn") : "-",
  }))

  exportToExcel(data, "سجل_التوزيع_والمسح_الميداني", "التوزيع")
}
