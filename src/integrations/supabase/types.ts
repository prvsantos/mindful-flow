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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          alert_threshold_pct: number
          daily_limit_per_user: number
          enabled: boolean
          id: number
          max_output_tokens: number
          min_interval_seconds: number
          monthly_global_limit: number
          retention_days: number
          updated_at: string
        }
        Insert: {
          alert_threshold_pct?: number
          daily_limit_per_user?: number
          enabled?: boolean
          id?: number
          max_output_tokens?: number
          min_interval_seconds?: number
          monthly_global_limit?: number
          retention_days?: number
          updated_at?: string
        }
        Update: {
          alert_threshold_pct?: number
          daily_limit_per_user?: number
          enabled?: boolean
          id?: number
          max_output_tokens?: number
          min_interval_seconds?: number
          monthly_global_limit?: number
          retention_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string
          est_cost_usd: number | null
          feature: string
          finished_at: string | null
          id: string
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          est_cost_usd?: number | null
          feature: string
          finished_at?: string | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          est_cost_usd?: number | null
          feature?: string
          finished_at?: string | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      brain_dumps: {
        Row: {
          ai_result: Json | null
          created_at: string
          id: string
          kind: string
          raw_text: string
          user_id: string
        }
        Insert: {
          ai_result?: Json | null
          created_at?: string
          id?: string
          kind?: string
          raw_text: string
          user_id?: string
        }
        Update: {
          ai_result?: Json | null
          created_at?: string
          id?: string
          kind?: string
          raw_text?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          label: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          label: string
          slug: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          label?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          energy: number | null
          feeling: string | null
          helped: string | null
          id: string
          mood: number
          not_helped: string | null
          thoughts: string | null
          user_id: string
          what_happened: string | null
        }
        Insert: {
          created_at?: string
          energy?: number | null
          feeling?: string | null
          helped?: string | null
          id?: string
          mood?: number
          not_helped?: string | null
          thoughts?: string | null
          user_id?: string
          what_happened?: string | null
        }
        Update: {
          created_at?: string
          energy?: number | null
          feeling?: string | null
          helped?: string | null
          id?: string
          mood?: number
          not_helped?: string | null
          thoughts?: string | null
          user_id?: string
          what_happened?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          area: string
          created_at: string
          done: boolean
          done_at: string | null
          due_at: string | null
          id: string
          notes: string | null
          priority: string
          remind_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          area?: string
          created_at?: string
          done?: boolean
          done_at?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          remind_at?: string | null
          title: string
          user_id?: string
        }
        Update: {
          area?: string
          created_at?: string
          done?: boolean
          done_at?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          remind_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          notice_version: string
          purpose: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted: boolean
          id?: string
          notice_version: string
          purpose: string
          user_id?: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          notice_version?: string
          purpose?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_begin_call: { Args: { _feature: string }; Returns: Json }
      ai_finish_call: {
        Args: {
          _cost: number
          _id: string
          _in: number
          _model: string
          _out: number
          _status: string
        }
        Returns: undefined
      }
      ai_usage_summary: { Args: never; Returns: Json }
      has_consent: {
        Args: { _purpose: string; _uid?: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mask_email: { Args: { _email: string }; Returns: string }
      my_effective_role: {
        Args: { _uid?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      sync_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role: "owner" | "premium" | "lite"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["owner", "premium", "lite"],
    },
  },
} as const
