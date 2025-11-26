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
      artwork_collection: {
        Row: {
          acquisition: string
          artist: string
          created_at: string
          description: string
          display_order: number | null
          id: string
          image_url: string | null
          medium: string
          price: string
          title: string
          updated_at: string
          user_id: string
          year: string
        }
        Insert: {
          acquisition: string
          artist: string
          created_at?: string
          description: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          medium: string
          price: string
          title: string
          updated_at?: string
          user_id: string
          year: string
        }
        Update: {
          acquisition?: string
          artist?: string
          created_at?: string
          description?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          medium?: string
          price?: string
          title?: string
          updated_at?: string
          user_id?: string
          year?: string
        }
        Relationships: []
      }
      business_content: {
        Row: {
          achievements_text: string | null
          company_description: string | null
          company_logo_url: string | null
          company_name: string | null
          company_photos: string[] | null
          created_at: string
          id: string
          portfolio_text: string | null
          position_title: string | null
          updated_at: string
          user_id: string
          vision_text: string | null
        }
        Insert: {
          achievements_text?: string | null
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_photos?: string[] | null
          created_at?: string
          id?: string
          portfolio_text?: string | null
          position_title?: string | null
          updated_at?: string
          user_id: string
          vision_text?: string | null
        }
        Update: {
          achievements_text?: string | null
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_photos?: string[] | null
          created_at?: string
          id?: string
          portfolio_text?: string | null
          position_title?: string | null
          updated_at?: string
          user_id?: string
          vision_text?: string | null
        }
        Relationships: []
      }
      connection_requests: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      curated_sports: {
        Row: {
          badge_text: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          sport_type: string
          stat1_label: string | null
          stat1_value: string | null
          stat2_label: string | null
          stat2_value: string | null
          stat3_label: string | null
          stat3_value: string | null
          subtitle: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_text?: string | null
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          sport_type: string
          stat1_label?: string | null
          stat1_value?: string | null
          stat2_label?: string | null
          stat2_value?: string | null
          stat3_label?: string | null
          stat3_value?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_text?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          sport_type?: string
          stat1_label?: string | null
          stat1_value?: string | null
          stat2_label?: string | null
          stat2_value?: string | null
          stat3_label?: string | null
          stat3_value?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          lieu: string
          saison: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          lieu: string
          saison: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          lieu?: string
          saison?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exhibitions: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          location: string
          role: string
          title: string
          updated_at: string
          user_id: string
          year: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          location: string
          role: string
          title: string
          updated_at?: string
          user_id: string
          year: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          location?: string
          role?: string
          title?: string
          updated_at?: string
          user_id?: string
          year?: string
        }
        Relationships: []
      }
      family_content: {
        Row: {
          anecdotes_text: string | null
          bio: string | null
          created_at: string
          family_text: string | null
          gallery_photos: Json | null
          id: string
          network_text: string | null
          personal_quote: string | null
          philanthropy_text: string | null
          portrait_url: string | null
          residences_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anecdotes_text?: string | null
          bio?: string | null
          created_at?: string
          family_text?: string | null
          gallery_photos?: Json | null
          id?: string
          network_text?: string | null
          personal_quote?: string | null
          philanthropy_text?: string | null
          portrait_url?: string | null
          residences_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anecdotes_text?: string | null
          bio?: string | null
          created_at?: string
          family_text?: string | null
          gallery_photos?: Json | null
          id?: string
          network_text?: string | null
          personal_quote?: string | null
          philanthropy_text?: string | null
          portrait_url?: string | null
          residences_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          business_access: boolean | null
          created_at: string
          family_access: boolean | null
          friend_id: string
          id: string
          influence_access: boolean | null
          personal_access: boolean | null
          user_id: string
        }
        Insert: {
          business_access?: boolean | null
          created_at?: string
          family_access?: boolean | null
          friend_id: string
          id?: string
          influence_access?: boolean | null
          personal_access?: boolean | null
          user_id: string
        }
        Update: {
          business_access?: boolean | null
          created_at?: string
          family_access?: boolean | null
          friend_id?: string
          id?: string
          influence_access?: boolean | null
          personal_access?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_domain: string | null
          avatar_url: string | null
          biometric_enabled: boolean | null
          country: string | null
          created_at: string | null
          first_name: string
          honorific_title: string | null
          id: string
          is_founder: boolean | null
          is_patron: boolean | null
          job_function: string | null
          last_name: string
          mobile_phone: string
          personal_quote: string | null
          referral_code: string | null
          updated_at: string | null
          username: string | null
          wealth_amount: string | null
          wealth_billions: string | null
          wealth_currency: string | null
          wealth_unit: string | null
        }
        Insert: {
          activity_domain?: string | null
          avatar_url?: string | null
          biometric_enabled?: boolean | null
          country?: string | null
          created_at?: string | null
          first_name: string
          honorific_title?: string | null
          id: string
          is_founder?: boolean | null
          is_patron?: boolean | null
          job_function?: string | null
          last_name: string
          mobile_phone: string
          personal_quote?: string | null
          referral_code?: string | null
          updated_at?: string | null
          username?: string | null
          wealth_amount?: string | null
          wealth_billions?: string | null
          wealth_currency?: string | null
          wealth_unit?: string | null
        }
        Update: {
          activity_domain?: string | null
          avatar_url?: string | null
          biometric_enabled?: boolean | null
          country?: string | null
          created_at?: string | null
          first_name?: string
          honorific_title?: string | null
          id?: string
          is_founder?: boolean | null
          is_patron?: boolean | null
          job_function?: string | null
          last_name?: string
          mobile_phone?: string
          personal_quote?: string | null
          referral_code?: string | null
          updated_at?: string | null
          username?: string | null
          wealth_amount?: string | null
          wealth_billions?: string | null
          wealth_currency?: string | null
          wealth_unit?: string | null
        }
        Relationships: []
      }
      social_influence: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          metric: string
          platform: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          metric: string
          platform: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          metric?: string
          platform?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      sports_hobbies: {
        Row: {
          badge_text: string | null
          created_at: string
          description: string
          display_order: number | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_text?: string | null
          created_at?: string
          description: string
          display_order?: number | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_text?: string | null
          created_at?: string
          description?: string
          display_order?: number | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      create_private_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { conv_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
    },
  },
} as const
