import type { Metadata } from "next"
import { AuthRedirect } from "./auth-redirect"

export const metadata: Metadata = {
  title: "RideLogger — Volunteer Drive Planner",
  description:
    "Plan volunteer drive days in minutes. Save passenger profiles, named locations, and get a distance and time table ready to copy onto your paper form.",
}

export default function RootPage() {
  return (
    <>
      <AuthRedirect />
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center justify-between px-4 py-4 sm:px-8 border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-7 w-7" aria-hidden="true" />
            <span className="font-semibold text-base">RideLogger</span>
          </div>
          <nav className="flex items-center gap-2" aria-label="Site navigation">
            <a
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </a>
            <a
              href="/signup"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign up
            </a>
          </nav>
        </header>

        <main className="flex-1">
          <section className="px-4 py-16 sm:px-8 sm:py-24 text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Plan your volunteer drive day in minutes
            </h1>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
              Save your passengers and locations once. RideLogger builds the distance and time table
              you need to fill in your paper form — every time.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/signup"
                className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get started — it&apos;s free
              </a>
              <a
                href="/login"
                className="rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                Sign in
              </a>
            </div>
          </section>

          <section className="px-4 pb-16 sm:px-8 sm:pb-24" aria-label="Features">
            <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Feature
                title="Passenger profiles"
                description="Save each passenger with their name and home address. No re-entering details every drive day."
              />
              <Feature
                title="Named locations"
                description="Store your regular pickup points and destinations — medical centres, community hubs, hospitals."
              />
              <Feature
                title="Drive planner"
                description="Select which passengers you're driving, set your route, and plan each leg of the trip."
              />
              <Feature
                title="Distance & time table"
                description="Get a ready-to-copy table of distances and travel times to transfer onto your paper form."
              />
            </div>
          </section>

          <section className="px-4 pb-16 sm:px-8 sm:pb-24 text-center">
            <div className="max-w-sm mx-auto space-y-4">
              <p className="text-sm text-muted-foreground">
                Built for Australian community transport volunteer drivers.
              </p>
              <a
                href="/signup"
                className="inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create your account
              </a>
            </div>
          </section>
        </main>

        <footer className="px-4 py-6 sm:px-8 border-t border-border text-center">
          <a
            href="/privacy"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Privacy policy
          </a>
        </footer>
      </div>
    </>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
