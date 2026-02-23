export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_messages: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          message_type: string
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          message_type?: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          message_type?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      balance_adjustments: {
        Row: {
          adjustment_type: string
          admin_id: string
          amount: number
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          adjustment_type: string
          admin_id: string
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          adjustment_type?: string
          admin_id?: string
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          contribution_date: string
          created_at: string
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          contribution_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          contribution_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance_adjustment: number
          balance_visible: boolean
          created_at: string
          daily_contribution_amount: number
          full_name: string
          id: string
          missed_contributions: number
          phone_number: string | null
          updated_at: string
          user_id: string
          member_status: Database["public"]["Enums"]["member_status"]
          member_role: Database["public"]["Enums"]["member_role"]
          penalty_amount: number | null
          reward_amount: number | null
          verified_at: string | null
          document_verified: boolean | null
        }
        Insert: {
          balance_adjustment?: number
          balance_visible?: boolean
          created_at?: string
          daily_contribution_amount?: number
          full_name: string
          id?: string
          missed_contributions?: number
          phone_number?: string | null
          updated_at?: string
          user_id: string
          member_status?: Database["public"]["Enums"]["member_status"]
          member_role?: Database["public"]["Enums"]["member_role"]
          penalty_amount?: number | null
          reward_amount?: number | null
          verified_at?: string | null
          document_verified?: boolean | null
        }
        Update: {
          balance_adjustment?: number
          balance_visible?: boolean
          created_at?: string
          daily_contribution_amount?: number
          full_name?: string
          id?: string
          missed_contributions?: number
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          member_status?: Database["public"]["Enums"]["member_status"]
          member_role?: Database["public"]["Enums"]["member_role"]
          penalty_amount?: number | null
          reward_amount?: number | null
          verified_at?: string | null
          document_verified?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          id: string
          user_id: string
          admin_id: string | null
          amount: number
          status: Database["public"]["Enums"]["withdrawal_status"]
          reason: string | null
          rejection_reason: string | null
          created_at: string
          reviewed_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          admin_id?: string | null
          amount: number
          status?: Database["public"]["Enums"]["withdrawal_status"]
          reason?: string | null
          rejection_reason?: string | null
          created_at?: string
          reviewed_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          admin_id?: string | null
          amount?: number
          status?: Database["public"]["Enums"]["withdrawal_status"]
          reason?: string | null
          rejection_reason?: string | null
          created_at?: string
          reviewed_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      member_notes: {
        Row: {
          id: string
          user_id: string
          admin_id: string | null
          note: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          admin_id?: string | null
          note: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          admin_id?: string | null
          note?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_penalties: {
        Row: {
          id: string
          user_id: string
          admin_id: string | null
          amount: number
          reason: string | null
          applied_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          admin_id?: string | null
          amount: number
          reason?: string | null
          applied_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          admin_id?: string | null
          amount?: number
          reason?: string | null
          applied_date?: string
          created_at?: string
        }
        Relationships: []
      }
      member_rewards: {
        Row: {
          id: string
          user_id: string
          admin_id: string | null
          amount: number
          reason: string | null
          awarded_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          admin_id?: string | null
          amount: number
          reason?: string | null
          awarded_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          admin_id?: string | null
          amount?: number
          reason?: string | null
          awarded_date?: string
          created_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          admin_id: string
          title: string
          content: string
          sent_to_all: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          title: string
          content: string
          sent_to_all?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          title?: string
          content?: string
          sent_to_all?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          changes: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
      member_status: "active" | "inactive" | "suspended"
      member_role: "member" | "coordinator" | "leader"
      withdrawal_status: "pending" | "approved" | "rejected" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
      member_status: ["active", "inactive", "suspended"],
      member_role: ["member", "coordinator", "leader"],
      withdrawal_status: ["pending", "approved", "rejected", "completed"],
    },
  },
} as const
