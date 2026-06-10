"use client"

import { useState } from "react"
import { Check, Tag as TagIcon, ChevronDown } from "lucide-react"
import { updateBeneficiaryTags, updateFamilyTags } from "@/app/actions/tag-actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// =============================================================================
// TYPES
// =============================================================================

export interface TagData {
  id: string
  nameAr: string
  category: string
  color: string
  isActive: boolean
}

interface TagBadgeProps {
  tag: TagData
  size?: "sm" | "md"
}

interface TagSelectorProps {
  entityId: string
  entityType: "beneficiary" | "family"
  allTags: TagData[]
  selectedTagIds: string[]
  category?: string
  label?: string
  onUpdate?: () => void
}

interface TagFilterPillsProps {
  tags: TagData[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  placeholder?: string
}

// =============================================================================
// TAG BADGE — شارة التصنيف الملونة
// =============================================================================

export function TagBadge({ tag, size = "sm" }: TagBadgeProps) {
  const textSize = size === "sm" ? "text-[10px]" : "text-xs"
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${textSize} border`}
      style={{
        backgroundColor: `${tag.color}20`,
        borderColor: `${tag.color}50`,
        color: tag.color,
      }}
    >
      {tag.nameAr}
    </span>
  )
}

// =============================================================================
// TAG SELECTOR — اختيار تصنيفات متعددة عبر DropdownMenu
// =============================================================================

export function TagSelector({
  entityId,
  entityType,
  allTags,
  selectedTagIds,
  category,
  label = "+ تصنيف",
  onUpdate,
}: TagSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedTagIds)
  const [saving, setSaving] = useState(false)

  const filteredTags = category ? allTags.filter((t) => t.category === category) : allTags

  const toggle = async (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id]
    setSelected(next)

    setSaving(true)
    if (entityType === "beneficiary") {
      await updateBeneficiaryTags(entityId, next)
    } else {
      await updateFamilyTags(entityId, next)
    }
    setSaving(false)
    onUpdate?.()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-6 gap-1 border-dashed border-white/20 bg-white/5 px-2 text-[10px] text-white/60 hover:bg-white/10 hover:text-white"
          disabled={saving}
        >
          <TagIcon className="h-3 w-3" />
          {saving ? "..." : label}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 border border-white/10 bg-gray-900 text-white shadow-2xl"
        align="start"
      >
        <DropdownMenuLabel className="text-xs text-white/60">التصنيفات</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {filteredTags.length === 0 ? (
          <div className="py-2 px-3 text-xs text-white/40 text-center">لا توجد تصنيفات</div>
        ) : (
          filteredTags.map((tag) => (
            <DropdownMenuItem
              key={tag.id}
              onClick={() => toggle(tag.id)}
              className="flex items-center gap-2 cursor-pointer focus:bg-white/10"
            >
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="flex-1 text-xs">{tag.nameAr}</span>
              {selected.includes(tag.id) && (
                <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// =============================================================================
// TAG FILTER PILLS — أزرار فلترة سريعة
// =============================================================================

export function TagFilterPills({ tags, selectedId, onSelect, placeholder = "الكل" }: TagFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
          selectedId === null
            ? "bg-white text-gray-900 border-white"
            : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
        }`}
      >
        {placeholder}
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onSelect(selectedId === tag.id ? null : tag.id)}
          className="rounded-full px-3 py-1 text-xs font-semibold transition-all border"
          style={
            selectedId === tag.id
              ? { backgroundColor: tag.color, borderColor: tag.color, color: "#fff" }
              : {
                  backgroundColor: `${tag.color}15`,
                  borderColor: `${tag.color}40`,
                  color: tag.color,
                }
          }
        >
          {tag.nameAr}
        </button>
      ))}
    </div>
  )
}
