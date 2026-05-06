export interface Passenger {
  id: string
  user_id: string
  name: string
  home_location_id: string
  home_address: string
  home_lat: number | null
  home_lon: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  user_id: string
  name: string
  address: string
  lat: number | null
  lon: number | null
  created_at: string
  updated_at: string
}

export interface AppSettings {
  id: string
  user_id: string
  home_location_id: string
  home_address: string
  home_lat: number | null
  home_lon: number | null
  created_at: string
  updated_at: string
}

export interface DriveLegInput {
  fromLocationId: string
  toLocationId: string
  label: string
  passengerLeg?: boolean
}

export interface DriveLegResult {
  label: string
  distanceKm: number
  durationMin: number
  error?: string
  passengerLeg?: boolean
}
