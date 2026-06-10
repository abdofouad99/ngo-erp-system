import { redirect } from "next/navigation"

// Root route redirects to the main dashboard
export default function RootPage() {
  redirect("/dashboard")
}
