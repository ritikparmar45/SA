"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useFlightStore } from "@/stores/useFlightStore"
import { useUserStore } from "@/stores/useUserStore"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const flightId = params.flightId as string
  
  const { selectedSeatId, passengerForm, setPassengerForm, bookingStep, setBookingStep, resetBooking } = useFlightStore()
  const { session } = useUserStore()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [pnr, setPnr] = useState("")

  // Security & State check
  useEffect(() => {
    if (!session) {
      router.push(`/login?redirect=/book/${flightId}/checkout`)
      return
    }
    if (!selectedSeatId) {
      router.push(`/book/${flightId}`)
    }
  }, [session, selectedSeatId, flightId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      
      // 1. Fetch flight and seat to calculate total price
      const { data: flight } = await supabase.from('flights').select('base_price').eq('id', flightId).single()
      const { data: seat } = await supabase.from('seats').select('extra_fee').eq('id', selectedSeatId).single()
      
      if (!flight || !seat) throw new Error("Flight or Seat not found")
      
      const totalPrice = flight.base_price + seat.extra_fee
      
      // 2. Generate Random PNR (In production this would be handled securely on backend)
      const generatedPnr = Math.random().toString(36).substring(2, 8).toUpperCase()

      // 3. Call RPC for atomic reservation
      const { data, error: rpcError } = await supabase.rpc('reserve_seat', {
        p_flight_id: flightId,
        p_seat_id: selectedSeatId,
        p_total_price: totalPrice,
        p_pnr_code: generatedPnr,
        p_full_name: passengerForm.fullName,
        p_passport_no: passengerForm.passportNo,
        p_nationality: passengerForm.nationality,
        p_dob: passengerForm.dob
      })

      if (rpcError) {
        throw rpcError
      }

      // Success
      setPnr(generatedPnr)
      setSuccess(true)
      setBookingStep("confirmation")
      
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to complete booking. The seat might have been taken.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center space-y-6">
        <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto" />
        <h1 className="text-4xl font-bold">Booking Confirmed!</h1>
        <p className="text-xl text-muted-foreground">Your PNR is: <strong className="text-foreground">{pnr}</strong></p>
        
        <div className="bg-card border border-border rounded-xl p-6 text-left space-y-2 mt-8 shadow-sm">
          <p><span className="text-muted-foreground inline-block w-32">Passenger:</span> {passengerForm.fullName}</p>
          <p><span className="text-muted-foreground inline-block w-32">Status:</span> Confirmed</p>
        </div>

        <Button size="lg" className="w-full" onClick={() => {
          resetBooking()
          router.push('/bookings')
        }}>
          View My Bookings
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Passenger Details</h1>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-start gap-3 mb-8">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Passenger Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name (as per Passport)</label>
                <Input 
                  required 
                  value={passengerForm.fullName}
                  onChange={e => setPassengerForm({ fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Passport Number</label>
                  <Input 
                    required 
                    value={passengerForm.passportNo}
                    onChange={e => setPassengerForm({ passportNo: e.target.value })}
                    placeholder="A12345678"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nationality</label>
                  <Input 
                    required 
                    value={passengerForm.nationality}
                    onChange={e => setPassengerForm({ nationality: e.target.value })}
                    placeholder="e.g. USA"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Birth</label>
                <Input 
                  required 
                  type="date"
                  value={passengerForm.dob}
                  onChange={e => setPassengerForm({ dob: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Confirm & Pay"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
