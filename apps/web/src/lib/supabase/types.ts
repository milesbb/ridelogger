export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      passengers: {
        Row: {
          id: string
          user_id: string
          name: string
          home_address: string
          home_lat: number | null
          home_lon: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          home_address: string
          home_lat?: number | null
          home_lon?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          home_address?: string
          home_lat?: number | null
          home_lon?: number | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          user_id: string
          name: string
          address: string
          lat: number | null
          lon: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          address: string
          lat?: number | null
          lon?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          address?: string
          lat?: number | null
          lon?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          user_id: string
          home_address: string
          home_lat: number | null
          home_lon: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          home_address: string
          home_lat?: number | null
          home_lon?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          home_address?: string
          home_lat?: number | null
          home_lon?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Passenger = Database["public"]["Tables"]["passengers"]["Row"]
export type PassengerInsert = Database["public"]["Tables"]["passengers"]["Insert"]
export type PassengerUpdate = Database["public"]["Tables"]["passengers"]["Update"]

export type Location = Database["public"]["Tables"]["locations"]["Row"]
export type LocationInsert = Database["public"]["Tables"]["locations"]["Insert"]
export type LocationUpdate = Database["public"]["Tables"]["locations"]["Update"]

export type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"]
export type AppSettingsInsert = Database["public"]["Tables"]["app_settings"]["Insert"]
export type AppSettingsUpdate = Database["public"]["Tables"]["app_settings"]["Update"]
