"use client"

import { Seat } from "@/types/database"
import { cn } from "@/utils/cn"

interface SeatMapProps {
  seats: Seat[]
  selectedSeatId: string | null
  onSeatSelect: (seat: Seat) => void
}

export function SeatMap({ seats, selectedSeatId, onSeatSelect }: SeatMapProps) {
  // Group seats by row
  // Assuming seat_number format like "1A", "15F"
  const rows = seats.reduce((acc, seat) => {
    const match = seat.seat_number.match(/^(\d+)([A-Z]+)$/)
    if (match) {
      const rowNum = parseInt(match[1])
      if (!acc[rowNum]) acc[rowNum] = []
      acc[rowNum].push(seat)
    }
    return acc
  }, {} as Record<number, Seat[]>)

  const rowNumbers = Object.keys(rows).map(Number).sort((a, b) => a - b)

  const getClassColor = (seatClass: string) => {
    switch (seatClass) {
      case 'first': return 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200'
      case 'business': return 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
      default: return 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-card rounded-3xl p-6 shadow-inner border border-border">
      {/* Plane Nose Indicator */}
      <div className="w-full flex justify-center mb-8">
        <div className="w-32 h-16 bg-muted rounded-t-full border border-border flex items-center justify-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Cockpit</span>
        </div>
      </div>

      <div className="space-y-6">
        {rowNumbers.map((rowNum) => {
          const rowSeats = rows[rowNum].sort((a, b) => a.seat_number.localeCompare(b.seat_number))
          // Split into left (A,B,C) and right (D,E,F)
          const leftSeats = rowSeats.filter(s => ['A', 'B', 'C'].includes(s.seat_number.replace(/\d+/g, '')))
          const rightSeats = rowSeats.filter(s => ['D', 'E', 'F'].includes(s.seat_number.replace(/\d+/g, '')))

          return (
            <div key={rowNum} className="flex items-center justify-between">
              
              {/* Left Side */}
              <div className="flex gap-2">
                {leftSeats.map((seat) => {
                  const isSelected = seat.id === selectedSeatId
                  return (
                    <button
                      key={seat.id}
                      disabled={!seat.is_available}
                      onClick={() => onSeatSelect(seat)}
                      className={cn(
                        "w-10 h-10 rounded-t-lg rounded-b-sm border-2 flex items-center justify-center text-xs font-bold transition-all relative group",
                        !seat.is_available && "bg-muted border-muted-foreground/20 text-muted-foreground/30 cursor-not-allowed",
                        seat.is_available && !isSelected && getClassColor(seat.class),
                        isSelected && "bg-primary border-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 z-10"
                      )}
                      title={`${seat.seat_number} - ${seat.class.toUpperCase()} ${seat.extra_fee > 0 ? `(+$${seat.extra_fee})` : ''}`}
                    >
                      {seat.seat_number.replace(/\d+/g, '')}
                      
                      {/* Tooltip */}
                      {seat.is_available && !isSelected && (
                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-max px-2 py-1 bg-foreground text-background text-[10px] rounded shadow-xl z-20 pointer-events-none">
                          {seat.class} {seat.extra_fee > 0 && `+$${seat.extra_fee}`}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Aisle (Row Number) */}
              <div className="w-8 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                {rowNum}
              </div>

              {/* Right Side */}
              <div className="flex gap-2">
                {rightSeats.map((seat) => {
                  const isSelected = seat.id === selectedSeatId
                  return (
                    <button
                      key={seat.id}
                      disabled={!seat.is_available}
                      onClick={() => onSeatSelect(seat)}
                      className={cn(
                        "w-10 h-10 rounded-t-lg rounded-b-sm border-2 flex items-center justify-center text-xs font-bold transition-all relative group",
                        !seat.is_available && "bg-muted border-muted-foreground/20 text-muted-foreground/30 cursor-not-allowed",
                        seat.is_available && !isSelected && getClassColor(seat.class),
                        isSelected && "bg-primary border-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 z-10"
                      )}
                      title={`${seat.seat_number} - ${seat.class.toUpperCase()} ${seat.extra_fee > 0 ? `(+$${seat.extra_fee})` : ''}`}
                    >
                      {seat.seat_number.replace(/\d+/g, '')}
                      
                      {/* Tooltip */}
                      {seat.is_available && !isSelected && (
                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-max px-2 py-1 bg-foreground text-background text-[10px] rounded shadow-xl z-20 pointer-events-none">
                          {seat.class} {seat.extra_fee > 0 && `+$${seat.extra_fee}`}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

            </div>
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-12 flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div> First</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div> Business</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-100 border border-slate-300"></div> Economy</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-primary border border-primary"></div> Selected</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-muted border border-muted-foreground/20"></div> Occupied</div>
      </div>
    </div>
  )
}
