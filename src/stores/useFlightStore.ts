import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PassengerForm = {
  fullName: string
  passportNo: string
  nationality: string
  dob: string
}

export type FlightSearchQuery = {
  origin: string
  destination: string
  date: string
  passengers: number
}

type FlightStoreState = {
  searchQuery: FlightSearchQuery
  selectedFlightId: string | null
  selectedSeatId: string | null
  bookingStep: 'search' | 'seat-selection' | 'checkout' | 'confirmation'
  passengerForm: PassengerForm
  setSearchQuery: (query: Partial<FlightSearchQuery>) => void
  setSelectedFlightId: (id: string | null) => void
  setSelectedSeatId: (id: string | null) => void
  setBookingStep: (step: FlightStoreState['bookingStep']) => void
  setPassengerForm: (form: Partial<PassengerForm>) => void
  resetBooking: () => void
}

const initialPassengerForm: PassengerForm = {
  fullName: '',
  passportNo: '',
  nationality: '',
  dob: ''
}

export const useFlightStore = create<FlightStoreState>()(
  persist(
    (set) => ({
      searchQuery: {
        origin: '',
        destination: '',
        date: '',
        passengers: 1
      },
      selectedFlightId: null,
      selectedSeatId: null,
      bookingStep: 'search',
      passengerForm: initialPassengerForm,

      setSearchQuery: (query) => set((state) => ({ searchQuery: { ...state.searchQuery, ...query } })),
      setSelectedFlightId: (id) => set({ selectedFlightId: id }),
      setSelectedSeatId: (id) => set({ selectedSeatId: id }),
      setBookingStep: (step) => set({ bookingStep: step }),
      setPassengerForm: (form) => set((state) => ({ passengerForm: { ...state.passengerForm, ...form } })),
      resetBooking: () => set({
        selectedFlightId: null,
        selectedSeatId: null,
        bookingStep: 'search',
        passengerForm: initialPassengerForm
      })
    }),
    {
      name: 'flight-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // We persist everything except the passport number for security
        searchQuery: state.searchQuery,
        selectedFlightId: state.selectedFlightId,
        selectedSeatId: state.selectedSeatId,
        bookingStep: state.bookingStep,
        passengerForm: {
          ...state.passengerForm,
          passportNo: '' // NEVER persist passport numbers
        }
      })
    }
  )
)
