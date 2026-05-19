"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useFlightStore } from "@/stores/useFlightStore"
import { useSeatRealtime } from "@/hooks/useSeatRealtime"
import { SeatMap } from "@/components/SeatMap"
import { Seat, Flight } from "@/types/database"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/utils/supabase/client"
import { ArrowLeft, ArrowRight } from "lucide-react"

export default function SeatSelectionPage() {
  const params = useParams()
  const router = useRouter()
  const flightId = params.flightId as string
  
  const { selectedSeatId, setSelectedSeatId, setBookingStep } = useFlightStore()
  const { seats, loading: seatsLoading } = useSeatRealtime(flightId)
  
  const [flight, setFlight] = useState<Flight | null>(null)
  const [flightLoading, setFlightLoading] = useState(true)

  useEffect(() => {
    async function fetchFlight() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('flights')
        .select('*')
        .eq('id', flightId)
        .single()
        
      if (!error && data) {
        setFlight(data as Flight)
      }
      setFlightLoading(false)
    }
    fetchFlight()
  }, [flightId])

  const handleSeatSelect = (seat: Seat) => {
    if (selectedSeatId === seat.id) {
      setSelectedSeatId(null) // Deselect
    } else {
      setSelectedSeatId(seat.id)
    }
  }

  const handleContinue = () => {
    if (selectedSeatId) {
      setBookingStep("checkout")
      router.push(`/book/${flightId}/checkout`)
    }
  }

  const selectedSeat = seats.find(s => s.id === selectedSeatId)
  const totalPrice = flight && selectedSeat ? flight.base_price + selectedSeat.extra_fee : 0

  if (flightLoading || seatsLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading flight details and seat map...</p>
      </div>
    )
  }

  if (!flight) {
    return <div className="container mx-auto px-4 py-12 text-center text-red-500">Flight not found.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Col: Flight Summary & Action */}
        <div className="w-full md:w-1/3 order-2 md:order-1 space-y-6">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to flights
          </button>
          
          <div>
            <h1 className="text-3xl font-bold mb-2">Select Seat</h1>
            <p className="text-muted-foreground">
              {flight.origin} to {flight.destination}
            </p>
          </div>

          {selectedSeat ? (
            <div className="bg-card border border-primary/50 rounded-xl p-6 shadow-md animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-semibold text-lg mb-4">Selection Summary</h3>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seat</span>
                  <span className="font-bold">{selectedSeat.seat_number} ({selectedSeat.class})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price</span>
                  <span>${flight.base_price}</span>
                </div>
                {selectedSeat.extra_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seat Fee</span>
                    <span>${selectedSeat.extra_fee}</span>
                  </div>
                )}
                <div className="pt-4 mt-4 border-t border-border flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">${totalPrice}</span>
                </div>
              </div>
              
              <Button size="lg" className="w-full text-lg" onClick={handleContinue}>
                Continue to Checkout <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="bg-muted rounded-xl p-6 text-center border border-border border-dashed">
              <p className="text-muted-foreground">Please select a seat from the map to continue.</p>
            </div>
          )}
        </div>

        {/* Right Col: Seat Map */}
        <div className="w-full md:w-2/3 order-1 md:order-2 flex justify-center">
          <SeatMap 
            seats={seats} 
            selectedSeatId={selectedSeatId} 
            onSeatSelect={handleSeatSelect} 
          />
        </div>

      </div>
    </div>
  )
}
