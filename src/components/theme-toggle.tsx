"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    // Check initial theme state from classList or localStorage
    const savedTheme = localStorage.getItem("ngo_theme")
    if (savedTheme === "light") {
      setIsDark(false)
      document.documentElement.classList.remove("dark")
    } else {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("ngo_theme", "light")
      setIsDark(false)
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("ngo_theme", "dark")
      setIsDark(true)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="relative flex items-center gap-2 rounded-xl border border-teal-500/30 bg-slate-900/60 dark:bg-slate-900/80 light:bg-white text-teal-500 dark:text-teal-400 light:text-[#1C355E] hover:border-teal-500/60 transition-all duration-300 shadow-md h-9 px-3 font-bold text-xs"
      title={isDark ? "التبديل إلى الوضع الفاتح الرسمى" : "التبديل إلى الوضع المظلم النيوني"}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 text-amber-400 animate-spin-slow" />
          <span className="hidden sm:inline">الوضع الفاتح</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-[#1C355E]" />
          <span className="hidden sm:inline">الوضع المظلم</span>
        </>
      )}
    </Button>
  )
}
