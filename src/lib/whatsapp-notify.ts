/**
 * WhatsApp Notification Helper
 * Sends messages to recipients via the local wppconnect-bot API server running on port 5005.
 */
export async function sendWhatsAppNotification(phone: string, message: string): Promise<boolean> {
  if (!phone || !message) return false

  try {
    // Format the phone number (remove non-digits)
    const cleanedPhone = phone.replace(/\D/g, "")
    if (!cleanedPhone) return false

    const botApiUrl = "http://127.0.0.1:5005/send"
    const response = await fetch(botApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: cleanedPhone,
        message: message,
      }),
    })

    if (!response.ok) {
      console.warn(`⚠️ WhatsApp bot API returned status: ${response.status}`)
    }

    return response.ok
  } catch (error) {
    console.warn("⚠️ Local WhatsApp bot API is unreachable or not running:", error)
    return false
  }
}
