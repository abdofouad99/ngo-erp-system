"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { globalSearch } from "@/app/actions/search-actions"
import { Search, Users, Baby, HeartHandshake, Loader2, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"

export function GlobalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Trigger search on query change
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true)
        const res = await globalSearch(query)
        if (res.success && res.results) {
          setResults(res.results)
          setShowDropdown(true)
        }
        setLoading(false)
      } else {
        setResults([])
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query])

  const handleResultClick = (href: string) => {
    router.push(href)
    setShowDropdown(false)
    setQuery("")
  }

  const getIcon = (type: string) => {
    if (type === "FAMILY") return <Users className="h-4 w-4 text-blue-500" />
    if (type === "BENEFICIARY") return <Baby className="h-4 w-4 text-emerald-500" />
    return <HeartHandshake className="h-4 w-4 text-rose-500" />
  };

  return (
    <div className="relative w-full max-w-md print-hide" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Input
          type="text"
          placeholder="بحث سريع عن أسرة، يتيم، كفيل..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
          className="w-full h-9 pl-9 pr-9 text-xs rounded-xl bg-slate-900/60 border-border/80 focus-visible:bg-slate-900 text-right placeholder-slate-500 font-semibold focus-visible:ring-emerald-500 focus:border-emerald-500/50"
        />
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {loading && (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500" />
        )}
      </div>

      {/* Floating Dropdown Results */}
      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-border bg-card/95 backdrop-blur-md p-2 shadow-2xl text-right glass-panel">
          {results.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground font-medium">
              لا توجد أي نتائج مطابقة للبحث.
            </div>
          ) : (
            <div className="space-y-1">
              <p className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground border-b border-border/50">
                نتائج الاستعلام الموحد ({results.length})
              </p>
              {results.map((res) => (
                <button
                   key={`${res.type}-${res.id}`}
                   onClick={() => handleResultClick(res.href)}
                   className="w-full flex items-center justify-between rounded-lg p-2.5 text-right transition-all hover:bg-slate-800/40 text-xs font-semibold text-foreground"
                >
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                    <span>الانتقال</span>
                    <ArrowLeft className="h-3 w-3" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-100 text-xs">{res.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground mt-0.5">{res.subtitle}</p>
                    </div>
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900/50 border border-border">
                      {getIcon(res.type)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
