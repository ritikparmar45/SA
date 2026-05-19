"use client"

import Link from "next/link"
import { PlaneTakeoff, User, Menu, X } from "lucide-react"
import { useState } from "react"
import { useUserStore } from "@/stores/useUserStore"
import { Button } from "./ui/Button"

export function Navbar() {
  const { session, clearAuth } = useUserStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    // In a real app we would call supabase.auth.signOut() here
    clearAuth()
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <PlaneTakeoff className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">AeroFlow</span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/search" className="text-sm font-medium hover:text-primary transition-colors">
            Search Flights
          </Link>
          {session ? (
            <>
              <Link href="/bookings" className="text-sm font-medium hover:text-primary transition-colors">
                My Bookings
              </Link>
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign up</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Nav Toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 flex flex-col space-y-4">
          <Link 
            href="/search" 
            className="text-sm font-medium p-2 hover:bg-accent hover:text-accent-foreground rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Search Flights
          </Link>
          {session ? (
            <>
              <Link 
                href="/bookings" 
                className="text-sm font-medium p-2 hover:bg-accent hover:text-accent-foreground rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Bookings
              </Link>
              <Button variant="ghost" className="justify-start px-2" onClick={() => {
                handleLogout()
                setIsMobileMenuOpen(false)
              }}>
                Logout
              </Button>
            </>
          ) : (
            <div className="flex flex-col space-y-2">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">Log in</Button>
              </Link>
              <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full justify-center">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
