// ترجمة نوع المستند للعربية — ملف مساعد (client & server safe)
export function translateDocumentType(type: string): string {
  const map: Record<string, string> = {
    NATIONAL_ID:          "صورة الهوية الوطنية",
    BIRTH_CERTIFICATE:    "شهادة الميلاد",
    DEATH_CERTIFICATE:    "شهادة الوفاة",
    MARRIAGE_CERTIFICATE: "عقد الزواج",
    DISABILITY_CARD:      "بطاقة الإعاقة",
    FIELD_PHOTO:          "صورة ميدانية",
    DELIVERY_PROOF:       "إثبات التسليم",
    MEDICAL_REPORT:       "تقرير طبي",
    MOTHER_ID:            "بطاقة الأم",
    GUARDIAN_ID:          "بطاقة هوية المعيل",
    ORPHAN_PHOTO_4X6:     "صورة 4×6 لليتيم",
    ORPHAN_PHOTO_10X15:   "صورة 10×15 لليتيم",
    OTHER:                "مستند آخر",
  }
  return map[type] || type
}
