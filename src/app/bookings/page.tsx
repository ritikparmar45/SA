"use client"

import { useEffect, useState } from "react"
import { useUserStore } from "@/stores/useUserStore"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Plane, AlertCircle } from "lucide-react"

export default function MyBookingsPage() {
  const { session } = useUserStore()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchBookings() {
      if (!session) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, status, pnr_code, total_price, booked_at,
          flight:flights ( id, flight_no, origin, destination, departs_at, arrives_at ),
          seat:seats ( id, seat_number, class ),
          passengers ( full_name )
        `)
        .eq('user_id', session.user.id)
        .order('booked_at', { ascending: false })

      if (error) {
        console.error(error)
        setError("Failed to load bookings.")
      } else {
        setBookings(data)
      }
      setLoading(false)
    }

    fetchBookings()
  }, [session])

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: bookingId
      })

      if (error) throw error

      // Optimistically update UI
      setBookings(current => 
        current.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b)
      )
      alert("Booking cancelled successfully.")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to cancel booking. It may be within 2 hours of departure.")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 w-full bg-accent/20 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Please log in to view your bookings</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-8">
          {error}
        </div>
      )}

      {bookings.length === 0 && !error ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">You have no bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const flight = Array.isArray(booking.flight) ? booking.flight[0] : booking.flight
            const seat = Array.isArray(booking.seat) ? booking.seat[0] : booking.seat
            const passenger = booking.passengers?.[0]
            
            const isCancelled = booking.status === 'cancelled'
            const isConfirmed = booking.status === 'confirmed'

            return (
              <Card key={booking.id} className={isCancelled ? "opacity-75 grayscale" : ""}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm bg-accent/20 text-accent-foreground px-2 py-1 rounded">
                            PNR: {booking.pnr_code}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded uppercase ${
                            isConfirmed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Booked on {format(new Date(booking.booked_at), 'MMM dd, yyyy')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-xl font-bold">{format(new Date(flight.departs_at), 'HH:mm')}</p>
                          <p className="text-sm text-muted-foreground">{flight.origin}</p>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="h-[1px] bg-border flex-1 mx-2" />
                          <Plane className="w-5 h-5 text-primary" />
                          <div className="h-[1px] bg-border flex-1 mx-2" />
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold">{format(new Date(flight.arrives_at), 'HH:mm')}</p>
                          <p className="text-sm text-muted-foreground">{flight.destination}</p>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>Passenger: <span className="font-medium text-foreground">{passenger?.full_name}</span></p>
                        <p>Seat: <span className="font-medium text-foreground">{seat?.seat_number} ({seat?.class})</span></p>
                        <p>Flight Date: <span className="font-medium text-foreground">{format(new Date(flight.departs_at), 'MMM dd, yyyy')}</span></p>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 min-w-[150px]">
                      <div className="text-right w-full mb-4">
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <p className="text-2xl font-bold text-primary">${booking.total_price}</p>
                      </div>
                      
                      {isConfirmed && (
                        <div className="flex flex-col space-y-2 w-full">
                          <Button variant="outline" className="w-full text-xs" onClick={() => alert("Reschedule functionality coming soon!")}>
                            Reschedule
                          </Button>
                          <Button variant="destructive" className="w-full text-xs" onClick={() => handleCancel(booking.id)}>
                            Cancel Booking
                          </Button>
                        </div>
                      )}
                    </div>

                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
