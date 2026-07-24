"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null)

  useEffect(() => {
    // Read from localStorage
    const saved = localStorage.getItem("ngo_theme")
    const currentlyDark = document.documentElement.classList.contains("dark")
    
    if (saved === "light") {
      document.documentElement.classList.remove("dark")
      setIsDark(false)
    } else {
      document.documentElement.classList.add("dark")
      setIsDark(true)
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      // Switch to LIGHT
      document.documentElement.classList.remove("dark")
      localStorage.setItem("ngo_theme", "light")
      setIsDark(false)
    } else {
      // Switch to DARK
      document.documentElement.classList.add("dark")
      localStorage.setItem("ngo_theme", "dark")
      setIsDark(true)
    }
  }

  // Don't render until we know the theme (avoids hydration flash)
  if (isDark === null) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className={`
        relative flex items-center gap-2 rounded-xl h-9 px-3 font-bold text-xs
        transition-all duration-300 border
        ${isDark
          ? "bg-slate-800/70 border-teal-500/30 text-teal-400 hover:border-teal-400/60 hover:bg-slate-700/70"
          : "bg-white border-[#1C355E]/20 text-[#1C355E] hover:border-[#00B2A9]/50 hover:bg-[#00B2A9]/5 shadow-sm"
        }
      `}
      title={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع المظلم"}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 text-amber-400" />
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
