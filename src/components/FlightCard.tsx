import { Flight } from "@/types/database"
import { Card, CardContent } from "./ui/Card"
import { Button } from "./ui/Button"
import { format, differenceInMinutes } from "date-fns"
import { Plane } from "lucide-react"

interface FlightCardProps {
  flight: Flight
  passengers: number
  onSelect: (flightId: string) => void
}

export function FlightCard({ flight, passengers, onSelect }: FlightCardProps) {
  const departs = new Date(flight.departs_at)
  const arrives = new Date(flight.arrives_at)
  
  const durationMins = differenceInMinutes(arrives, departs)
  const hours = Math.floor(durationMins / 60)
  const mins = durationMins % 60

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-primary">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-center p-6 gap-6">
          
          <div className="flex-1 w-full grid grid-cols-3 items-center gap-4 text-center md:text-left">
            <div>
              <p className="text-2xl font-bold">{format(departs, 'HH:mm')}</p>
              <p className="text-lg font-semibold text-muted-foreground">{flight.origin}</p>
              <p className="text-xs text-muted-foreground">{format(departs, 'MMM dd')}</p>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <p className="text-xs text-muted-foreground mb-1">{hours}h {mins}m</p>
              <div className="w-full flex items-center">
                <div className="h-[1px] bg-border flex-1" />
                <Plane className="w-4 h-4 mx-2 text-primary" />
                <div className="h-[1px] bg-border flex-1" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Non-stop</p>
            </div>
            
            <div>
              <p className="text-2xl font-bold">{format(arrives, 'HH:mm')}</p>
              <p className="text-lg font-semibold text-muted-foreground">{flight.destination}</p>
              <p className="text-xs text-muted-foreground">{format(arrives, 'MMM dd')}</p>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex flex-row md:flex-col items-center justify-between md:justify-center border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
            <div className="text-center md:text-right mb-0 md:mb-4">
              <p className="text-sm text-muted-foreground">From</p>
              <p className="text-2xl font-bold text-primary">${flight.base_price}</p>
            </div>
            <Button size="lg" onClick={() => onSelect(flight.id)}>
              Select Seats
            </Button>
          </div>
          
        </div>
      </CardContent>
    </Card>
  )
}
