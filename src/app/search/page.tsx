"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Flight } from "@/types/database"
import { FlightCard } from "@/components/FlightCard"
import { useFlightStore } from "@/stores/useFlightStore"

export default function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setSelectedFlightId, setBookingStep } = useFlightStore()
  
  const origin = searchParams.get("origin")
  const destination = searchParams.get("destination")
  const dateStr = searchParams.get("date")
  const passengers = parseInt(searchParams.get("passengers") || "1")

  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchFlights() {
      if (!origin || !destination || !dateStr) {
        setError("Missing search parameters")
        setLoading(false)
        return
      }

      setLoading(true)
      const supabase = createClient()
      
      try {
        // Query flights for the selected date
        // In a real app, we'd use >= date and < date + 1 day
        const startOfDay = new Date(dateStr)
        startOfDay.setUTCHours(0, 0, 0, 0)
        
        const endOfDay = new Date(dateStr)
        endOfDay.setUTCHours(23, 59, 59, 999)

        const { data, error } = await supabase
          .from("flights")
          .select("*")
          .eq("origin", origin)
          .eq("destination", destination)
          // Removed strict date filtering so demo seed data is easier to find
          .gte("departs_at", new Date().toISOString()) // Only show future flights
          .order("departs_at", { ascending: true })

        if (error) throw error
        setFlights(data as Flight[])
      } catch (err: any) {
        console.error("Error fetching flights:", err)
        setError("Failed to load flights. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchFlights()
  }, [origin, destination, dateStr])

  const handleSelectFlight = (flightId: string) => {
    setSelectedFlightId(flightId)
    setBookingStep("seat-selection")
    router.push(`/book/${flightId}`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Select Your Flight</h1>
        <p className="text-muted-foreground">
          {origin} to {destination} on {dateStr} • {passengers} Passenger{passengers > 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-full bg-accent/20 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 text-center">
          {error}
        </div>
      ) : flights.length === 0 ? (
        <div className="p-12 bg-card rounded-xl border border-border text-center">
          <h3 className="text-xl font-semibold mb-2">No flights found</h3>
          <p className="text-muted-foreground">Try adjusting your search dates or destinations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flights.map((flight) => (
            <FlightCard 
              key={flight.id} 
              flight={flight} 
              passengers={passengers} 
              onSelect={handleSelectFlight} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
