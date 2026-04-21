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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          check_in: string | null
          check_out: string | null
          clinic_id: string
          collaborator_id: string | null
          company_id: string | null
          created_at: string
          exam_type_id: string
          id: string
          queue_entry_id: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          clinic_id: string
          collaborator_id?: string | null
          company_id?: string | null
          created_at?: string
          exam_type_id: string
          id?: string
          queue_entry_id?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          clinic_id?: string
          collaborator_id?: string | null
          company_id?: string | null
          created_at?: string
          exam_type_id?: string
          id?: string
          queue_entry_id?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_queue_entry_id_fkey"
            columns: ["queue_entry_id"]
            isOneToOne: false
            referencedRelation: "queue_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_logs: {
        Row: {
          actual_duration: number
          clinic_id: string
          created_at: string
          day_of_week: number
          exam_type_id: string
          finished_at: string
          id: string
          started_at: string
          time_slot: string
        }
        Insert: {
          actual_duration: number
          clinic_id: string
          created_at?: string
          day_of_week: number
          exam_type_id: string
          finished_at: string
          id?: string
          started_at: string
          time_slot: string
        }
        Update: {
          actual_duration?: number
          clinic_id?: string
          created_at?: string
          day_of_week?: number
          exam_type_id?: string
          finished_at?: string
          id?: string
          started_at?: string
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          clinic_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          clinic_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          clinic_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      collaborator_tokens: {
        Row: {
          clinic_id: string
          collaborator_id: string
          created_at: string
          expires_at: string
          id: string
          is_revoked: boolean
          token: string
          used_at: string | null
        }
        Insert: {
          clinic_id: string
          collaborator_id: string
          created_at?: string
          expires_at?: string
          id?: string
          is_revoked?: boolean
          token?: string
          used_at?: string | null
        }
        Update: {
          clinic_id?: string
          collaborator_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_revoked?: boolean
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_tokens_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_tokens_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborators: {
        Row: {
          clinic_id: string
          company_id: string
          cpf: string | null
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          clinic_id: string
          company_id: string
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          clinic_id?: string
          company_id?: string
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          clinic_id: string
          cnpj: string | null
          contact_email: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          cnpj?: string | null
          contact_email: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          cnpj?: string | null
          contact_email?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_types: {
        Row: {
          average_duration: number | null
          clinic_id: string
          created_at: string
          default_duration: number
          id: string
          is_active: boolean
          name: string
          requires_read_confirm: boolean
          result_retention_days: number
          result_visible_to_company: boolean
          updated_at: string
        }
        Insert: {
          average_duration?: number | null
          clinic_id: string
          created_at?: string
          default_duration?: number
          id?: string
          is_active?: boolean
          name: string
          requires_read_confirm?: boolean
          result_retention_days?: number
          result_visible_to_company?: boolean
          updated_at?: string
        }
        Update: {
          average_duration?: number | null
          clinic_id?: string
          created_at?: string
          default_duration?: number
          id?: string
          is_active?: boolean
          name?: string
          requires_read_confirm?: boolean
          result_retention_days?: number
          result_visible_to_company?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_types_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_events: {
        Row: {
          clinic_id: string
          id: string
          impact_minutes: number
          note: string | null
          queue_id: string
          recorded_at: string
          recorded_by: string | null
          type: string
        }
        Insert: {
          clinic_id: string
          id?: string
          impact_minutes?: number
          note?: string | null
          queue_id: string
          recorded_at?: string
          recorded_by?: string | null
          type: string
        }
        Update: {
          clinic_id?: string
          id?: string
          impact_minutes?: number
          note?: string | null
          queue_id?: string
          recorded_at?: string
          recorded_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_events_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clinic_id: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_entries: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          client_name: string | null
          clinic_id: string
          created_at: string
          estimated_wait: number
          exam_type_id: string
          id: string
          phone: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          public_token: string
          queue_id: string
          status: Database["public"]["Enums"]["entry_status"]
          ticket_number: number
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          client_name?: string | null
          clinic_id: string
          created_at?: string
          estimated_wait?: number
          exam_type_id: string
          id?: string
          phone?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          public_token?: string
          queue_id: string
          status?: Database["public"]["Enums"]["entry_status"]
          ticket_number: number
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          client_name?: string | null
          clinic_id?: string
          created_at?: string
          estimated_wait?: number
          exam_type_id?: string
          id?: string
          phone?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          public_token?: string
          queue_id?: string
          status?: Database["public"]["Enums"]["entry_status"]
          ticket_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      queues: {
        Row: {
          clinic_id: string
          created_at: string
          date: string
          id: string
          pause_reason: string | null
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date: string
          id?: string
          pause_reason?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string
          id?: string
          pause_reason?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queues_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          clinic_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_operate_clinic: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      get_collaborator_by_token: {
        Args: { _token: string }
        Returns: {
          clinic_id: string
          clinic_name: string
          collaborator_id: string
          collaborator_name: string
          company_name: string
          token_valid: boolean
        }[]
      }
      get_day_occupancy: {
        Args: { _clinic_id: string; _date: string }
        Returns: {
          count: number
          hour_start: number
          level: string
          slot: string
        }[]
      }
      get_entry_by_token: {
        Args: { _token: string }
        Returns: {
          ahead_count: number
          clinic_name: string
          estimated_wait: number
          exam_type_name: string
          priority: Database["public"]["Enums"]["priority_level"]
          queue_position: number
          status: Database["public"]["Enums"]["entry_status"]
          ticket_number: number
        }[]
      }
      has_clinic_access: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clinic_admin: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      suggest_best_slots: {
        Args: { _clinic_id: string; _date: string }
        Returns: {
          count: number
          hour_start: number
          slot_time: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "clinic_admin"
        | "operator"
        | "viewer"
        | "company_manager"
      appointment_status:
        | "scheduled"
        | "checked_in"
        | "in_progress"
        | "completed"
        | "no_show"
        | "cancelled"
      entry_status: "waiting" | "in_progress" | "done" | "absent"
      priority_level: "normal" | "elder" | "urgent"
      queue_status: "open" | "paused" | "closed"
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
      app_role: [
        "super_admin",
        "clinic_admin",
        "operator",
        "viewer",
        "company_manager",
      ],
      appointment_status: [
        "scheduled",
        "checked_in",
        "in_progress",
        "completed",
        "no_show",
        "cancelled",
      ],
      entry_status: ["waiting", "in_progress", "done", "absent"],
      priority_level: ["normal", "elder", "urgent"],
      queue_status: ["open", "paused", "closed"],
    },
  },
} as const
