import Link from "next/link"
import { PlaneTakeoff } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <PlaneTakeoff className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tight">AeroFlow</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Experience the future of flight booking. Seamless, fast, and secure.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Bookings</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-primary">Search Flights</Link></li>
              <li><Link href="/bookings" className="hover:text-primary">Manage Bookings</Link></li>
              <li><Link href="/check-in" className="hover:text-primary">Web Check-in</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
              <li><Link href="/cancellations" className="hover:text-primary">Cancellations & Refunds</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} AeroFlow. All rights reserved.</p>
          <div className="mt-4 md:mt-0 space-x-4">
            {/* Social Icons could go here */}
          </div>
        </div>
      </div>
    </footer>
  )
}
