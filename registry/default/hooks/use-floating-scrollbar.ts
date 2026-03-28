"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface ContainerRect {
  left: number
  width: number
}

interface UseFloatingScrollbarReturn {
  tableWrapperRef: React.RefObject<HTMLDivElement | null>
  scrollBarRef: React.RefObject<HTMLDivElement | null>
  sentinelRef: React.RefObject<HTMLDivElement | null>
  showFloatingBar: boolean
  tableWidth: number
  containerRect: ContainerRect | null
  handleBarScroll: () => void
}

export function useFloatingScrollbar(): UseFloatingScrollbarReturn {
  // Ref to wrapper div - we'll find the actual scroll container inside
  const tableWrapperRef = useRef<HTMLDivElement | null>(null)
  const scrollBarRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Ref to actual scroll container (shadcn table-container with overflow-x-auto)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const [showFloatingBar, setShowFloatingBar] = useState(false)
  const [tableWidth, setTableWidth] = useState(0)
  const [containerRect, setContainerRect] = useState<ContainerRect | null>(null)

  // Refs for preventing feedback loop
  const isScrollingFromBar = useRef(false)
  const isScrollingFromTable = useRef(false)
  const rafId = useRef<number | null>(null)

  // Find the actual scroll container (shadcn table-container)
  useEffect(() => {
    if (!tableWrapperRef.current) return

    // shadcn Table wraps table in div[data-slot="table-container"] with overflow-x-auto
    const scrollContainer = tableWrapperRef.current.querySelector<HTMLDivElement>(
      '[data-slot="table-container"]'
    )

    if (scrollContainer) {
      scrollContainerRef.current = scrollContainer

      // Attach scroll listener to the actual scroll container
      const handleScroll = () => {
        if (isScrollingFromBar.current) return

        requestAnimationFrame(() => {
          if (scrollBarRef.current && scrollContainerRef.current) {
            isScrollingFromTable.current = true
            scrollBarRef.current.scrollLeft = scrollContainerRef.current.scrollLeft
            requestAnimationFrame(() => {
              isScrollingFromTable.current = false
            })
          }
        })
      }

      scrollContainer.addEventListener("scroll", handleScroll, { passive: true })

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  // IntersectionObserver - detect when sentinel (bottom of table) is visible
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show floating bar when sentinel is NOT intersecting (table bottom not visible)
        setShowFloatingBar(!entry.isIntersecting)
      },
      { threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // ResizeObserver - track container dimensions and position
  useEffect(() => {
    const wrapper = tableWrapperRef.current
    if (!wrapper) return

    const updateDimensions = () => {
      const rect = wrapper.getBoundingClientRect()
      setContainerRect({ left: rect.left, width: rect.width })

      // Get table width from the actual scroll container
      const scrollContainer = scrollContainerRef.current
      if (scrollContainer) {
        setTableWidth(scrollContainer.scrollWidth)
      }
    }

    // Initial measurement (with small delay to ensure DOM is ready)
    const timeoutId = setTimeout(updateDimensions, 50)

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })

    resizeObserver.observe(wrapper)

    // Also update on window scroll (for position changes)
    const handleWindowScroll = () => {
      if (rafId.current) return
      rafId.current = requestAnimationFrame(() => {
        updateDimensions()
        rafId.current = null
      })
    }

    window.addEventListener("scroll", handleWindowScroll, { passive: true })
    window.addEventListener("resize", updateDimensions, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
      window.removeEventListener("scroll", handleWindowScroll)
      window.removeEventListener("resize", updateDimensions)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  // RAF-throttled scroll sync: floating bar → table
  const handleBarScroll = useCallback(() => {
    if (isScrollingFromTable.current) return

    requestAnimationFrame(() => {
      if (scrollBarRef.current && scrollContainerRef.current) {
        isScrollingFromBar.current = true
        scrollContainerRef.current.scrollLeft = scrollBarRef.current.scrollLeft
        requestAnimationFrame(() => {
          isScrollingFromBar.current = false
        })
      }
    })
  }, [])

  return {
    tableWrapperRef,
    scrollBarRef,
    sentinelRef,
    showFloatingBar,
    tableWidth,
    containerRect,
    handleBarScroll,
  }
}
