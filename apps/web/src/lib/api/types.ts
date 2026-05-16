export interface Passenger {
  id: string
  user_id: string
  name: string
  home_location_id: string
  home_address: string
  home_lat: number | null
  home_lon: number | null
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
  fromLocationName?: string
  toLocationName?: string
}

export interface SaveLegInput {
  fromLocationId: string
  toLocationId: string
  passengerId: string | null
  label: string
  distanceKm: number
  durationMin: number
  isPassengerLeg: boolean
}

export interface SaveDriveDayInput {
  date: string
  startTime: string | null
  legs: SaveLegInput[]
}

export interface DriveDaySummary {
  id: string
  user_id: string
  date: string
  start_time: string | null
  passenger_names: string[]
  total_km: number
  total_min: number
  passenger_km: number
  passenger_min: number
  created_at: string
  updated_at: string
}

export interface SavedLeg {
  id: string
  drive_day_id: string
  user_id: string
  from_location_id: string
  to_location_id: string
  passenger_id: string | null
  label: string
  distance_km: number
  duration_min: number
  is_passenger_leg: boolean
  position: number
  from_location_name: string | null
  to_location_name: string | null
  created_at: string
  updated_at: string
}

export interface ExportLeg extends SavedLeg {
  drive_date: string
  passenger_names: string[]
}

export interface DriveDayDetail extends DriveDaySummary {
  legs: SavedLeg[]
}

export interface UserPreferences {
  drive_log_calendar_default: boolean
  theme: 'light' | 'dark'
}
