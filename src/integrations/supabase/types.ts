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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      coupons: {
        Row: {
          code: string
          created_at: string | null
          id: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          status: Database["public"]["Enums"]["coupon_status"]
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["coupon_status"]
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["coupon_status"]
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          id: string
          name: string
          payout: number
          price: number
          referral_bonus: number
          type: Database["public"]["Enums"]["plan_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          payout: number
          price: number
          referral_bonus: number
          type: Database["public"]["Enums"]["plan_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          payout?: number
          price?: number
          referral_bonus?: number
          type?: Database["public"]["Enums"]["plan_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_name: string
          bank_account_number: string
          bank_name: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          referral_code: string
          referral_code_used: string | null
          referred_by: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          bank_account_number: string
          bank_name: string
          created_at?: string | null
          email: string
          full_name: string
          id: string
          referral_code: string
          referral_code_used?: string | null
          referred_by?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          bank_account_number?: string
          bank_name?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          referral_code?: string
          referral_code_used?: string | null
          referred_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_amount: number
          created_at: string | null
          id: string
          is_paid: boolean | null
          referred_id: string
          referrer_id: string
        }
        Insert: {
          bonus_amount: number
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          referred_id: string
          referrer_id: string
        }
        Update: {
          bonus_amount?: number
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      triangle_members: {
        Row: {
          id: string
          is_paid_out: boolean | null
          joined_at: string | null
          level: number
          position: number
          triangle_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_paid_out?: boolean | null
          joined_at?: string | null
          level: number
          position: number
          triangle_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_paid_out?: boolean | null
          joined_at?: string | null
          level?: number
          position?: number
          triangle_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "triangle_members_triangle_id_fkey"
            columns: ["triangle_id"]
            isOneToOne: false
            referencedRelation: "triangles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triangle_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      triangles: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_complete: boolean | null
          parent_triangle_id: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          split_side: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_complete?: boolean | null
          parent_triangle_id?: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          split_side?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_complete?: boolean | null
          parent_triangle_id?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          split_side?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "triangles_parent_triangle_id_fkey"
            columns: ["parent_triangle_id"]
            isOneToOne: false
            referencedRelation: "triangles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          complaint_details: Json | null
          complaint_submitted: boolean | null
          completed_at: string | null
          id: string
          new_coupon_code: string | null
          processing_at: string | null
          referral_bonus: number
          requested_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          telegram_username: string | null
          total_amount: number
          triangle_member_id: string
          user_id: string
        }
        Insert: {
          amount: number
          complaint_details?: Json | null
          complaint_submitted?: boolean | null
          completed_at?: string | null
          id?: string
          new_coupon_code?: string | null
          processing_at?: string | null
          referral_bonus: number
          requested_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          telegram_username?: string | null
          total_amount: number
          triangle_member_id: string
          user_id: string
        }
        Update: {
          amount?: number
          complaint_details?: Json | null
          complaint_submitted?: boolean | null
          completed_at?: string | null
          id?: string
          new_coupon_code?: string | null
          processing_at?: string | null
          referral_bonus?: number
          requested_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          telegram_username?: string | null
          total_amount?: number
          triangle_member_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_triangle_member_id_fkey"
            columns: ["triangle_member_id"]
            isOneToOne: false
            referencedRelation: "triangle_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      coupon_status: "active" | "used"
      plan_type: "king" | "queen" | "prince" | "princess"
      withdrawal_status: "pending" | "processing" | "completed" | "not_received"
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
      app_role: ["admin", "user"],
      coupon_status: ["active", "used"],
      plan_type: ["king", "queen", "prince", "princess"],
      withdrawal_status: ["pending", "processing", "completed", "not_received"],
    },
  },
} as const
