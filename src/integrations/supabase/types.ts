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
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          vehicle_brand: string
          vehicle_color: string
          vehicle_model: string
          vehicle_notes: string | null
          vehicle_plate: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          vehicle_brand?: string
          vehicle_color?: string
          vehicle_model?: string
          vehicle_notes?: string | null
          vehicle_plate?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          vehicle_brand?: string
          vehicle_color?: string
          vehicle_model?: string
          vehicle_notes?: string | null
          vehicle_plate?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          cost_per_unit: number
          created_at: string
          current_stock: number
          description: string | null
          id: string
          min_stock: number
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          min_stock?: number
          name: string
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          min_stock?: number
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_id: string
          movement_type: string
          notes: string | null
          quantity: number
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_inventory: {
        Row: {
          id: string
          inventory_id: string
          quantity: number
          service_type_id: string
        }
        Insert: {
          id?: string
          inventory_id: string
          quantity?: number
          service_type_id: string
        }
        Update: {
          id?: string
          inventory_id?: string
          quantity?: number
          service_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_inventory_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_inventory_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          id: string
          inventory_deducted: boolean | null
          notes: string | null
          price: number
          queued_at: string | null
          service_type_id: string | null
          started_at: string | null
          status: string
          updated_at: string | null
          vehicle_description: string | null
          vehicle_plate: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          id?: string
          inventory_deducted?: boolean | null
          notes?: string | null
          price?: number
          queued_at?: string | null
          service_type_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          vehicle_description?: string | null
          vehicle_plate: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          id?: string
          inventory_deducted?: boolean | null
          notes?: string | null
          price?: number
          queued_at?: string | null
          service_type_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          vehicle_description?: string | null
          vehicle_plate?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_records: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string
          employee_id: string | null
          id: string
          notes: string | null
          price: number
          service_type_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          price: number
          service_type_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          price?: number
          service_type_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          is_active: boolean
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
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
      vehicles: {
        Row: {
          brand: string
          client_id: string
          color: string | null
          created_at: string
          id: string
          model: string
          notes: string | null
          plate: string
          updated_at: string
          year: number | null
        }
        Insert: {
          brand: string
          client_id: string
          color?: string | null
          created_at?: string
          id?: string
          model: string
          notes?: string | null
          plate: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          brand?: string
          client_id?: string
          color?: string | null
          created_at?: string
          id?: string
          model?: string
          notes?: string | null
          plate?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      app_role: "admin" | "employee"
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
      app_role: ["admin", "employee"],
    },
  },
} as const
