export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string
          role: 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id: string
          nickname: string
          role?: 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          role?: 'admin' | 'member'
          created_at?: string
        }
      }
      invite_codes: {
        Row: {
          id: string
          code: string
          created_by: string
          used_by: string | null
          is_used: boolean
          created_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          code: string
          created_by: string
          used_by?: string | null
          is_used?: boolean
          created_at?: string
          used_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          created_by?: string
          used_by?: string | null
          is_used?: boolean
          created_at?: string
          used_at?: string | null
        }
      }
      seasons: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
        }
      }
      season_members: {
        Row: {
          id: string
          season_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          season_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      weeks: {
        Row: {
          id: string
          season_id: string
          week_number: number
          title: string | null
          start_date: string
          end_date: string
          is_current: boolean
          created_at: string
        }
        Insert: {
          id: string
          season_id: string
          week_number: number
          title?: string | null
          start_date: string
          end_date: string
          is_current?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          week_number?: number
          title?: string | null
          start_date?: string
          end_date?: string
          is_current?: boolean
          created_at?: string
        }
      }
      summaries: {
        Row: {
          id: string
          week_id: string
          author_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          week_id: string
          author_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          week_id?: string
          author_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      latest_summaries: {
        Row: {
          id: string
          week_id: string
          author_id: string
          content: string
          created_at: string
          updated_at: string
        }
      }
      first_summaries: {
        Row: {
          id: string
          week_id: string
          author_id: string
          content: string
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      [_: string]: never
    }
    Enums: {
      [_: string]: never
    }
  }
}
