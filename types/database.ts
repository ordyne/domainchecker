// Database type definitions for Supabase
// This file contains TypeScript types for your Supabase database schema

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
      domains: {
        Row: {
          id: string
          name: string
          status: 'registered' | 'available' | 'unknown'
          active: boolean
          last_checked: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: 'registered' | 'available' | 'unknown'
          active?: boolean
          last_checked?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: 'registered' | 'available' | 'unknown'
          active?: boolean
          last_checked?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          id: string
          domain_id: string
          sent_at: string
          status: 'sent' | 'failed'
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          domain_id: string
          sent_at?: string
          status: 'sent' | 'failed'
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          domain_id?: string
          sent_at?: string
          status?: 'sent' | 'failed'
          error_message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

// Helper types for common use cases
export type Domain = Tables<'domains'>
export type DomainInsert = TablesInsert<'domains'>
export type DomainUpdate = TablesUpdate<'domains'>

export type EmailNotification = Tables<'email_notifications'>
export type EmailNotificationInsert = TablesInsert<'email_notifications'>
export type EmailNotificationUpdate = TablesUpdate<'email_notifications'>
