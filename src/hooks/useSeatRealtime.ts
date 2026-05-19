import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Seat } from '@/types/database'

export function useSeatRealtime(flightId: string) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Initial fetch
  useEffect(() => {
    async function fetchSeats() {
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('flight_id', flightId)
        .order('seat_number')
      
      if (!error && data) {
        setSeats(data as Seat[])
      }
      setLoading(false)
    }
    
    fetchSeats()
  }, [flightId, supabase])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`public:seats:flight_id=eq.${flightId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => {
          const updatedSeat = payload.new as Seat
          setSeats((current) => 
            current.map((seat) => 
              seat.id === updatedSeat.id ? updatedSeat : seat
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [flightId, supabase])

  return { seats, loading }
}
