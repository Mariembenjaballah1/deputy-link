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
      complaint_audit_log: {
        Row: {
          action: string
          action_by: string
          action_by_role: string | null
          complaint_id: string
          created_at: string
          id: string
          new_value: Json | null
          notes: string | null
          old_value: Json | null
        }
        Insert: {
          action: string
          action_by: string
          action_by_role?: string | null
          complaint_id: string
          created_at?: string
          id?: string
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          action_by?: string
          action_by_role?: string | null
          complaint_id?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_audit_log_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_to: string
          category: string
          content: string
          created_at: string
          daira_id: string
          forwarded_at: string | null
          forwarded_to: string | null
          forwarded_to_deputy_id: string | null
          forwarding_method: string | null
          id: string
          images: string[] | null
          internal_notes: string | null
          local_deputy_id: string | null
          mp_id: string | null
          official_letter: string | null
          priority: string | null
          replied_at: string | null
          reply: string | null
          status: string
          updated_at: string
          user_id: string
          user_phone: string | null
          wilaya_id: string
        }
        Insert: {
          assigned_to: string
          category: string
          content: string
          created_at?: string
          daira_id: string
          forwarded_at?: string | null
          forwarded_to?: string | null
          forwarded_to_deputy_id?: string | null
          forwarding_method?: string | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          local_deputy_id?: string | null
          mp_id?: string | null
          official_letter?: string | null
          priority?: string | null
          replied_at?: string | null
          reply?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_phone?: string | null
          wilaya_id: string
        }
        Update: {
          assigned_to?: string
          category?: string
          content?: string
          created_at?: string
          daira_id?: string
          forwarded_at?: string | null
          forwarded_to?: string | null
          forwarded_to_deputy_id?: string | null
          forwarding_method?: string | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          local_deputy_id?: string | null
          mp_id?: string | null
          official_letter?: string | null
          priority?: string | null
          replied_at?: string | null
          reply?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_phone?: string | null
          wilaya_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_forwarded_to_deputy_id_fkey"
            columns: ["forwarded_to_deputy_id"]
            isOneToOne: false
            referencedRelation: "local_deputies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_mp_id_fkey"
            columns: ["mp_id"]
            isOneToOne: false
            referencedRelation: "mps"
            referencedColumns: ["id"]
          },
        ]
      }
      dairas: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          wilaya_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          wilaya_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          wilaya_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dairas_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      local_deputies: {
        Row: {
          bio: string | null
          created_at: string
          daira_id: string
          email: string | null
          id: string
          image: string | null
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string
          whatsapp_number: string | null
          wilaya_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          daira_id: string
          email?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          wilaya_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          daira_id?: string
          email?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          wilaya_id?: string
        }
        Relationships: []
      }
      mps: {
        Row: {
          bio: string | null
          bloc: string | null
          complaints_count: number | null
          created_at: string
          daira: string | null
          daira_id: string | null
          email: string | null
          id: string
          image: string | null
          is_active: boolean | null
          name: string
          phone: string | null
          profile_url: string | null
          response_rate: number | null
          updated_at: string
          wilaya: string
          wilaya_id: string | null
        }
        Insert: {
          bio?: string | null
          bloc?: string | null
          complaints_count?: number | null
          created_at?: string
          daira?: string | null
          daira_id?: string | null
          email?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name: string
          phone?: string | null
          profile_url?: string | null
          response_rate?: number | null
          updated_at?: string
          wilaya: string
          wilaya_id?: string | null
        }
        Update: {
          bio?: string | null
          bloc?: string | null
          complaints_count?: number | null
          created_at?: string
          daira?: string | null
          daira_id?: string | null
          email?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name?: string
          phone?: string | null
          profile_url?: string | null
          response_rate?: number | null
          updated_at?: string
          wilaya?: string
          wilaya_id?: string | null
        }
        Relationships: []
      }
      mutamadiyat: {
        Row: {
          created_at: string
          daira_id: string
          id: string
          name: string
          updated_at: string
          wilaya_id: string
        }
        Insert: {
          created_at?: string
          daira_id: string
          id?: string
          name: string
          updated_at?: string
          wilaya_id: string
        }
        Update: {
          created_at?: string
          daira_id?: string
          id?: string
          name?: string
          updated_at?: string
          wilaya_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mutamadiyat_daira_id_fkey"
            columns: ["daira_id"]
            isOneToOne: false
            referencedRelation: "dairas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutamadiyat_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_registrations: {
        Row: {
          created_at: string
          daira_id: string | null
          id: string
          name: string
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          role: string
          status: string
          wilaya_id: string
        }
        Insert: {
          created_at?: string
          daira_id?: string | null
          id?: string
          name: string
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role: string
          status?: string
          wilaya_id: string
        }
        Update: {
          created_at?: string
          daira_id?: string | null
          id?: string
          name?: string
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string
          status?: string
          wilaya_id?: string
        }
        Relationships: []
      }
      reply_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      wilayas: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
