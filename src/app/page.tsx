import { FlightSearchForm } from "@/components/FlightSearchForm"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center pt-20 pb-32 px-4 overflow-hidden">
        {/* Background Image / Gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        
        {/* Decorative Circles */}
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        
        <div className="relative z-10 container max-w-6xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground bg-clip-text">
              Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Journey</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Experience seamless booking, real-time seat selection, and next-generation travel management.
            </p>
          </div>

          <div className="pt-8 w-full">
            <FlightSearchForm />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary text-2xl">
                ⚡
              </div>
              <h3 className="text-xl font-bold">Lightning Fast Search</h3>
              <p className="text-muted-foreground">Find the best routes instantly with our optimized search engine.</p>
            </div>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary text-2xl">
                💺
              </div>
              <h3 className="text-xl font-bold">Interactive Seat Maps</h3>
              <p className="text-muted-foreground">Select your perfect seat visually with real-time availability updates.</p>
            </div>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary text-2xl">
                📱
              </div>
              <h3 className="text-xl font-bold">Offline Ready</h3>
              <p className="text-muted-foreground">Access your boarding passes and booking details even without internet.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
