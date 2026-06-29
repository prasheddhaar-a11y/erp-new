"use client"

import { Check, ChevronDown, Search, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"

export type BranchAdminSelectOption = {
  label: string
  value: string
  disabled?: boolean
  meta?: Record<string, unknown>
}

type MenuPosition = {
  top: number
  left: number
  width: number
}

export function BranchAdminSelect({
  label,
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  placeholder = "Select",
  searchable,
  clearable = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: BranchAdminSelectOption[]
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  searchable?: boolean
  clearable?: boolean
}) {
  const id = useMemo(() => `branch-admin-select-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`, [label])
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const [mounted, setMounted] = useState(false)
  const shouldSearch = searchable ?? options.length > 8
  const selected = options.find((option) => option.value === value)
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => [option.label, option.value].some((text) => text.toLowerCase().includes(needle)))
  }, [options, query])
  const enabledOptions = filtered.filter((option) => !option.disabled)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuHeight = Math.min(320, Math.max(156, 56 + filtered.length * 42))
      const spaceBelow = window.innerHeight - rect.bottom - 10
      const top = spaceBelow >= menuHeight ? rect.bottom + 6 : Math.max(10, rect.top - menuHeight - 6)
      setPosition({ top, left: Math.max(10, Math.min(rect.left, window.innerWidth - rect.width - 10)), width: rect.width })
    }
    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [filtered.length, open])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      const menu = document.getElementById(id)
      if (!triggerRef.current?.contains(target) && !menu?.contains(target)) closeMenu()
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [id, open])

  useEffect(() => {
    if (open && shouldSearch) window.setTimeout(() => searchRef.current?.focus(), 30)
  }, [open, shouldSearch])

  function closeMenu() {
    setOpen(false)
    setQuery("")
    setActiveIndex(0)
  }

  function openMenu() {
    if (disabled || loading) return
    setOpen(true)
  }

  function choose(nextValue: string) {
    onChange(nextValue)
    closeMenu()
    triggerRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault()
      openMenu()
      return
    }
    if (event.key === "Escape") closeMenu()
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      closeMenu()
      triggerRef.current?.focus()
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, Math.max(enabledOptions.length - 1, 0)))
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
      return
    }
    if (event.key === "Enter" && enabledOptions[activeIndex]) {
      event.preventDefault()
      choose(enabledOptions[activeIndex].value)
    }
  }

  return (
    <label className="grid gap-1.5 text-xs font-black uppercase text-[#64748B]">
      {label}
      <span className="relative block normal-case">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => (open ? closeMenu() : openMenu())}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          className="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-left text-sm font-semibold text-[#0F172A] outline-none transition hover:border-[#BFE3D3] hover:bg-white focus-visible:border-[#0B7A5A] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#CFE8DF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={`truncate ${selected ? "text-[#0F172A]" : "text-[#64748B]"}`}>{loading ? "Loading..." : selected?.label ?? placeholder}</span>
          <span className="flex shrink-0 items-center gap-1 text-[#0B7A5A]">
            {clearable && value && !disabled && !loading ? (
              <span
                role="button"
                aria-label={`Clear ${label}`}
                tabIndex={-1}
                onClick={(event) => {
                  event.stopPropagation()
                  onChange("")
                }}
                className="grid h-6 w-6 place-items-center rounded-full hover:bg-[#E8F6F0]"
              >
                <X size={14} />
              </span>
            ) : null}
            <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
      </span>
      {mounted && open && position ? createPortal(
        <div
          id={id}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className="branch-admin-select-menu fixed z-[10000] rounded-lg border border-[#DDE9E4] bg-white p-2 shadow-[0_18px_42px_rgba(15,23,42,0.18)]"
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          {shouldSearch ? (
            <div className="relative mb-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
                placeholder="Search"
                className="h-9 w-full rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] pl-9 pr-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-[#0B7A5A] focus:bg-white"
              />
            </div>
          ) : null}
          <div className="max-h-64 overflow-y-auto pr-1">
            {!loading && !filtered.length ? (
              <div className="rounded-lg bg-[#FBFDFC] px-3 py-6 text-center text-sm font-bold text-[#64748B]">No options found</div>
            ) : null}
            {filtered.map((option) => {
              const enabledIndex = enabledOptions.findIndex((enabled) => enabled.value === option.value)
              const active = enabledIndex === activeIndex
              const selectedOption = option.value === value
              return (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  role="option"
                  aria-selected={selectedOption}
                  disabled={option.disabled}
                  onClick={() => choose(option.value)}
                  className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${selectedOption ? "bg-[#E8F6F0] text-[#0B7A5A]" : active ? "bg-[#F1F8F4] text-[#071B4A]" : "text-[#071B4A] hover:bg-[#F1F8F4]"}`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {selectedOption ? <Check size={15} className="shrink-0 text-[#0B7A5A]" /> : null}
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      ) : null}
    </label>
  )
}
