"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFlightStore } from "@/stores/useFlightStore"
import { Card, CardContent } from "./ui/Card"
import { Input } from "./ui/Input"
import { Button } from "./ui/Button"
import { Plane, Calendar, Users } from "lucide-react"

export function FlightSearchForm() {
  const router = useRouter()
  const { searchQuery, setSearchQuery } = useFlightStore()
  
  const [origin, setOrigin] = useState(searchQuery.origin || "JFK")
  const [destination, setDestination] = useState(searchQuery.destination || "LHR")
  const [date, setDate] = useState(searchQuery.date || new Date().toISOString().split('T')[0])
  const [passengers, setPassengers] = useState(searchQuery.passengers || 1)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery({ origin, destination, date, passengers })
    
    // Convert date to a query param format if needed, or rely on store
    // relying on store is fine, but URL params are better for shareability
    const params = new URLSearchParams({
      origin,
      destination,
      date,
      passengers: passengers.toString()
    })
    
    router.push(`/search?${params.toString()}`)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl border-0 bg-card/90 backdrop-blur-md">
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-1 space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">From</label>
            <div className="relative">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                placeholder="Origin Code (e.g. JFK)"
                className="pl-9 h-12 uppercase"
                required
                maxLength={3}
              />
            </div>
          </div>
          
          <div className="md:col-span-1 space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">To</label>
            <div className="relative">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rotate-90" />
              <Input 
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
                placeholder="Dest Code (e.g. LHR)"
                className="pl-9 h-12 uppercase"
                required
                maxLength={3}
              />
            </div>
          </div>

          <div className="md:col-span-1 space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9 h-12"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="md:col-span-1 space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Passengers</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="number"
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
                min={1}
                max={9}
                className="pl-9 h-12"
                required
              />
            </div>
          </div>

          <div className="md:col-span-1 flex items-end">
            <Button type="submit" className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-primary/25 transition-all">
              Search
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
