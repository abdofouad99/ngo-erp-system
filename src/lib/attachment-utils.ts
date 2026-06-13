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
    OTHER:                "مستند آخر",
  }
  return map[type] || type
}
