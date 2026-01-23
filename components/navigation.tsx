"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Upload, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                UpSiteDown
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={pathname === "/" ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "transition-all duration-200",
                pathname === "/" && "shadow-sm"
              )}
            >
              <Link href="/" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Link>
            </Button>
            <Button
              variant={pathname === "/uploaded" ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "transition-all duration-200",
                pathname === "/uploaded" && "shadow-sm"
              )}
            >
              <Link href="/uploaded" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Gallery</span>
              </Link>
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
