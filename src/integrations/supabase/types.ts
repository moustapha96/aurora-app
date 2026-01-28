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
      activity_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
          bio_executive: string | null
          company_description: string | null
          company_logo_url: string | null
          company_name: string | null
          company_photos: string[] | null
          created_at: string
          id: string
          main_image_url: string | null
          onboarding_completed: boolean | null
          onboarding_mode: string | null
          portfolio_text: string | null
          position_title: string | null
          updated_at: string
          user_id: string
          vision_text: string | null
        }
        Insert: {
          achievements_text?: string | null
          bio_executive?: string | null
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_photos?: string[] | null
          created_at?: string
          id?: string
          main_image_url?: string | null
          onboarding_completed?: boolean | null
          onboarding_mode?: string | null
          portfolio_text?: string | null
          position_title?: string | null
          updated_at?: string
          user_id: string
          vision_text?: string | null
        }
        Update: {
          achievements_text?: string | null
          bio_executive?: string | null
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_photos?: string[] | null
          created_at?: string
          id?: string
          main_image_url?: string | null
          onboarding_completed?: boolean | null
          onboarding_mode?: string | null
          portfolio_text?: string | null
          position_title?: string | null
          updated_at?: string
          user_id?: string
          vision_text?: string | null
        }
        Relationships: []
      }
      business_documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_press: {
        Row: {
          created_at: string
          display_order: number | null
          distinction_type: string | null
          id: string
          source: string
          title: string
          updated_at: string
          url: string | null
          user_id: string
          year: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          distinction_type?: string | null
          id?: string
          source: string
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          year?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          distinction_type?: string | null
          id?: string
          source?: string
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      business_projects: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          images: string[] | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_timeline: {
        Row: {
          company: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          title: string
          updated_at: string
          user_id: string
          year: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
          year: string
        }
        Update: {
          company?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          year?: string
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
      contact_messages: {
        Row: {
          category: string
          created_at: string
          email: string
          id: string
          message: string
          phone: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          category: string
          created_at?: string
          email: string
          id?: string
          message: string
          phone?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          phone?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
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
      document_verifications: {
        Row: {
          created_at: string
          document_id: string
          document_path: string | null
          document_type: string
          file_name: string | null
          id: string
          notification_sent: boolean | null
          notification_sent_at: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
          verification_result: Json | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          document_path?: string | null
          document_type: string
          file_name?: string | null
          id?: string
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verification_result?: Json | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          document_path?: string | null
          document_type?: string
          file_name?: string | null
          id?: string
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_result?: Json | null
          verified_at?: string | null
          verified_by?: string | null
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
      family_audio: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          duration_seconds: number | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_board: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          expertise: string | null
          id: string
          image_url: string | null
          member_name: string
          organization: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          expertise?: string | null
          id?: string
          image_url?: string | null
          member_name: string
          organization?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          expertise?: string | null
          id?: string
          image_url?: string | null
          member_name?: string
          organization?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_close: {
        Row: {
          birth_year: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          member_name: string
          occupation: string | null
          relation_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_year?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          member_name: string
          occupation?: string | null
          relation_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_year?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          member_name?: string
          occupation?: string | null
          relation_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_commitments: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          document_url: string | null
          id: string
          image_url: string | null
          organization: string | null
          start_year: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          organization?: string | null
          start_year?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          organization?: string | null
          start_year?: string | null
          title?: string
          updated_at?: string
          user_id?: string
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
          onboarding_completed: boolean | null
          onboarding_mode: string | null
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
          onboarding_completed?: boolean | null
          onboarding_mode?: string | null
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
          onboarding_completed?: boolean | null
          onboarding_mode?: string | null
          personal_quote?: string | null
          philanthropy_text?: string | null
          portrait_url?: string | null
          residences_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_heritage: {
        Row: {
          banner_image_url: string | null
          created_at: string
          heritage_description: string | null
          id: string
          legacy_vision: string | null
          motto: string | null
          updated_at: string
          user_id: string
          values_text: string | null
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          heritage_description?: string | null
          id?: string
          legacy_vision?: string | null
          motto?: string | null
          updated_at?: string
          user_id: string
          values_text?: string | null
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          heritage_description?: string | null
          id?: string
          legacy_vision?: string | null
          motto?: string | null
          updated_at?: string
          user_id?: string
          values_text?: string | null
        }
        Relationships: []
      }
      family_influential: {
        Row: {
          context: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          person_name: string
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          person_name: string
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          person_name?: string
          relationship?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_lineage: {
        Row: {
          birth_year: string | null
          created_at: string
          description: string | null
          display_order: number | null
          generation: string
          id: string
          image_url: string | null
          member_name: string
          origin_location: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_year?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          generation: string
          id?: string
          image_url?: string | null
          member_name: string
          origin_location?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_year?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          generation?: string
          id?: string
          image_url?: string | null
          member_name?: string
          origin_location?: string | null
          title?: string | null
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
      golf_achievements: {
        Row: {
          achievement_type: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          result: string | null
          tournament_name: string | null
          updated_at: string
          user_id: string
          year: string | null
        }
        Insert: {
          achievement_type?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          result?: string | null
          tournament_name?: string | null
          updated_at?: string
          user_id: string
          year?: string | null
        }
        Update: {
          achievement_type?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          result?: string | null
          tournament_name?: string | null
          updated_at?: string
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      golf_courses: {
        Row: {
          best_score: number | null
          country: string | null
          course_name: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_favorite: boolean | null
          location: string | null
          par: number | null
          rating: string | null
          times_played: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score?: number | null
          country?: string | null
          course_name: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_favorite?: boolean | null
          location?: string | null
          par?: number | null
          rating?: string | null
          times_played?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score?: number | null
          country?: string | null
          course_name?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_favorite?: boolean | null
          location?: string | null
          par?: number | null
          rating?: string | null
          times_played?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      golf_gallery: {
        Row: {
          caption: string | null
          created_at: string
          date: string | null
          display_order: number | null
          id: string
          image_url: string | null
          location: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          date?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          location?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          date?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          location?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      golf_profiles: {
        Row: {
          club_city: string | null
          club_name: string | null
          created_at: string
          frequency: string | null
          handicap: string | null
          id: string
          level: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          club_city?: string | null
          club_name?: string | null
          created_at?: string
          frequency?: string | null
          handicap?: string | null
          id?: string
          level?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          club_city?: string | null
          club_name?: string | null
          created_at?: string
          frequency?: string | null
          handicap?: string | null
          id?: string
          level?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      identity_verifications: {
        Row: {
          created_at: string
          document_country: string | null
          document_type: string | null
          document_url: string | null
          first_name_extracted: string | null
          id: string
          jumio_account_id: string | null
          jumio_workflow_execution_id: string | null
          last_name_extracted: string | null
          status: string
          updated_at: string
          user_id: string
          verification_result: Json | null
          verification_type: string | null
        }
        Insert: {
          created_at?: string
          document_country?: string | null
          document_type?: string | null
          document_url?: string | null
          first_name_extracted?: string | null
          id?: string
          jumio_account_id?: string | null
          jumio_workflow_execution_id?: string | null
          last_name_extracted?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verification_result?: Json | null
          verification_type?: string | null
        }
        Update: {
          created_at?: string
          document_country?: string | null
          document_type?: string | null
          document_url?: string | null
          first_name_extracted?: string | null
          id?: string
          jumio_account_id?: string | null
          jumio_workflow_execution_id?: string | null
          last_name_extracted?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_result?: Json | null
          verification_type?: string | null
        }
        Relationships: []
      }
      landing_preferences: {
        Row: {
          created_at: string
          custom_description: string | null
          custom_headline: string | null
          id: string
          show_contact_button: boolean | null
          show_location: boolean | null
          show_quote: boolean | null
          show_wealth_badge: boolean | null
          template: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_description?: string | null
          custom_headline?: string | null
          id?: string
          show_contact_button?: boolean | null
          show_location?: boolean | null
          show_quote?: boolean | null
          show_wealth_badge?: boolean | null
          template?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_description?: string | null
          custom_headline?: string | null
          id?: string
          show_contact_button?: boolean | null
          show_location?: boolean | null
          show_quote?: boolean | null
          show_wealth_badge?: boolean | null
          template?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linked_accounts: {
        Row: {
          business_access: boolean | null
          created_at: string
          family_access: boolean | null
          id: string
          linked_user_id: string
          network_access: boolean | null
          personal_access: boolean | null
          relation_type: string
          sponsor_id: string
          updated_at: string
        }
        Insert: {
          business_access?: boolean | null
          created_at?: string
          family_access?: boolean | null
          id?: string
          linked_user_id: string
          network_access?: boolean | null
          personal_access?: boolean | null
          relation_type?: string
          sponsor_id: string
          updated_at?: string
        }
        Update: {
          business_access?: boolean | null
          created_at?: string
          family_access?: boolean | null
          id?: string
          linked_user_id?: string
          network_access?: boolean | null
          personal_access?: boolean | null
          relation_type?: string
          sponsor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          additional_images: string[] | null
          category: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          main_image_url: string | null
          offer_end_date: string | null
          price: number
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_images?: string[] | null
          category: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          main_image_url?: string | null
          offer_end_date?: string | null
          price: number
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_images?: string[] | null
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          main_image_url?: string | null
          offer_end_date?: string | null
          price?: number
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_payments: {
        Row: {
          amount: number
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          currency: string
          id: string
          item_id: string
          seller_id: string
          status: string
          stripe_payment_intent_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          item_id: string
          seller_id: string
          status?: string
          stripe_payment_intent_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          item_id?: string
          seller_id?: string
          status?: string
          stripe_payment_intent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_payments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
        ]
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
      network_ambitions: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          timeline: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          timeline?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          timeline?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_clubs: {
        Row: {
          club_type: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          role: string | null
          since_year: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          club_type?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          role?: string | null
          since_year?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          club_type?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          role?: string | null
          since_year?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_content: {
        Row: {
          created_at: string
          id: string
          onboarding_completed: boolean | null
          onboarding_mode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          onboarding_completed?: boolean | null
          onboarding_mode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          onboarding_completed?: boolean | null
          onboarding_mode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_events: {
        Row: {
          created_at: string
          date: string | null
          description: string | null
          display_order: number | null
          event_type: string | null
          id: string
          image_url: string | null
          location: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          description?: string | null
          display_order?: number | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          description?: string | null
          display_order?: number | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_influence: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          metric: string | null
          title: string
          updated_at: string
          user_id: string
          value: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          metric?: string | null
          title: string
          updated_at?: string
          user_id: string
          value?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          metric?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      network_media: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          media_type: string | null
          platform: string | null
          privacy_level: string | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
          year: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          media_type?: string | null
          platform?: string | null
          privacy_level?: string | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          year?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          media_type?: string | null
          platform?: string | null
          privacy_level?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      network_media_posture: {
        Row: {
          created_at: string
          id: string
          posture_text: string | null
          privacy_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          posture_text?: string | null
          privacy_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          posture_text?: string | null
          privacy_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_philanthropy: {
        Row: {
          cause: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          organization: string | null
          role: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cause?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          organization?: string | null
          role?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cause?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          organization?: string | null
          role?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_social_links: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          platform: string
          privacy_level: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          platform: string
          privacy_level?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          platform?: string
          privacy_level?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personal_art_culture: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_collections: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_content: {
        Row: {
          created_at: string
          id: string
          onboarding_completed: boolean | null
          onboarding_mode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          onboarding_completed?: boolean | null
          onboarding_mode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          onboarding_completed?: boolean | null
          onboarding_mode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_gastronomie: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_luxe: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_voyages: {
        Row: {
          created_at: string
          description: string | null
          destination: string
          display_order: number | null
          id: string
          image_url: string | null
          period: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          destination: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          period?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          destination?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          period?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      polo_achievements: {
        Row: {
          achievement_type: string | null
          created_at: string
          description: string | null
          display_order: number | null
          has_medals: boolean | null
          has_qualifications: boolean | null
          has_special_recognition: boolean | null
          has_trophies: boolean | null
          id: string
          result: string | null
          role_performance: string | null
          tournament_name: string | null
          updated_at: string
          user_id: string
          year: string | null
        }
        Insert: {
          achievement_type?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          has_medals?: boolean | null
          has_qualifications?: boolean | null
          has_special_recognition?: boolean | null
          has_trophies?: boolean | null
          id?: string
          result?: string | null
          role_performance?: string | null
          tournament_name?: string | null
          updated_at?: string
          user_id: string
          year?: string | null
        }
        Update: {
          achievement_type?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          has_medals?: boolean | null
          has_qualifications?: boolean | null
          has_special_recognition?: boolean | null
          has_trophies?: boolean | null
          id?: string
          result?: string | null
          role_performance?: string | null
          tournament_name?: string | null
          updated_at?: string
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      polo_gallery: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          slot_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          slot_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          slot_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      polo_horses: {
        Row: {
          age: number | null
          breed: string | null
          created_at: string
          display_order: number | null
          exclusive_rider: boolean | null
          id: string
          in_training: boolean | null
          is_own_horse: boolean | null
          is_primary: boolean | null
          name: string
          together_since: string | null
          tournament_wins: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          breed?: string | null
          created_at?: string
          display_order?: number | null
          exclusive_rider?: boolean | null
          id?: string
          in_training?: boolean | null
          is_own_horse?: boolean | null
          is_primary?: boolean | null
          name: string
          together_since?: string | null
          tournament_wins?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          breed?: string | null
          created_at?: string
          display_order?: number | null
          exclusive_rider?: boolean | null
          id?: string
          in_training?: boolean | null
          is_own_horse?: boolean | null
          is_primary?: boolean | null
          name?: string
          together_since?: string | null
          tournament_wins?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      polo_objectives: {
        Row: {
          created_at: string
          description: string
          display_order: number | null
          id: string
          is_completed: boolean | null
          objective_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number | null
          id?: string
          is_completed?: boolean | null
          objective_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number | null
          id?: string
          is_completed?: boolean | null
          objective_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      polo_profiles: {
        Row: {
          club_city: string | null
          club_name: string | null
          created_at: string
          frequency: string | null
          handicap: string | null
          id: string
          level: string | null
          preferred_position: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          club_city?: string | null
          club_name?: string | null
          created_at?: string
          frequency?: string | null
          handicap?: string | null
          id?: string
          level?: string | null
          preferred_position?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          club_city?: string | null
          club_name?: string | null
          created_at?: string
          frequency?: string | null
          handicap?: string | null
          id?: string
          level?: string | null
          preferred_position?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_active: boolean | null
          account_number: string | null
          activity_domain: string | null
          avatar_url: string | null
          biometric_enabled: boolean | null
          country: string | null
          created_at: string | null
          first_name: string
          honorific_title: string | null
          id: string
          identity_verified: boolean | null
          identity_verified_at: string | null
          is_founder: boolean | null
          is_linked_account: boolean | null
          is_patron: boolean | null
          job_function: string | null
          last_name: string
          linked_by_user_id: string | null
          personal_quote: string | null
          referral_code: string | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          username: string | null
          webauthn_enabled: boolean | null
        }
        Insert: {
          account_active?: boolean | null
          account_number?: string | null
          activity_domain?: string | null
          avatar_url?: string | null
          biometric_enabled?: boolean | null
          country?: string | null
          created_at?: string | null
          first_name: string
          honorific_title?: string | null
          id: string
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          is_founder?: boolean | null
          is_linked_account?: boolean | null
          is_patron?: boolean | null
          job_function?: string | null
          last_name: string
          linked_by_user_id?: string | null
          personal_quote?: string | null
          referral_code?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          username?: string | null
          webauthn_enabled?: boolean | null
        }
        Update: {
          account_active?: boolean | null
          account_number?: string | null
          activity_domain?: string | null
          avatar_url?: string | null
          biometric_enabled?: boolean | null
          country?: string | null
          created_at?: string | null
          first_name?: string
          honorific_title?: string | null
          id?: string
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          is_founder?: boolean | null
          is_linked_account?: boolean | null
          is_patron?: boolean | null
          job_function?: string | null
          last_name?: string
          linked_by_user_id?: string | null
          personal_quote?: string | null
          referral_code?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          username?: string | null
          webauthn_enabled?: boolean | null
        }
        Relationships: []
      }
      profiles_private: {
        Row: {
          created_at: string | null
          mobile_phone: string | null
          updated_at: string | null
          user_id: string
          wealth_amount: string | null
          wealth_billions: string | null
          wealth_currency: string | null
          wealth_unit: string | null
        }
        Insert: {
          created_at?: string | null
          mobile_phone?: string | null
          updated_at?: string | null
          user_id: string
          wealth_amount?: string | null
          wealth_billions?: string | null
          wealth_currency?: string | null
          wealth_unit?: string | null
        }
        Update: {
          created_at?: string | null
          mobile_phone?: string | null
          updated_at?: string | null
          user_id?: string
          wealth_amount?: string | null
          wealth_billions?: string | null
          wealth_currency?: string | null
          wealth_unit?: string | null
        }
        Relationships: []
      }
      referral_link_clicks: {
        Row: {
          clicked_at: string
          id: string
          ip_address: unknown
          link_id: string
          referer: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_address?: unknown
          link_id: string
          referer?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_address?: unknown
          link_id?: string
          referer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_links: {
        Row: {
          allowed_pages: Json | null
          click_count: number | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_family_link: boolean | null
          link_code: string
          link_name: string | null
          referral_code: string
          registration_count: number | null
          sponsor_id: string
          updated_at: string
        }
        Insert: {
          allowed_pages?: Json | null
          click_count?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_family_link?: boolean | null
          link_code: string
          link_name?: string | null
          referral_code: string
          registration_count?: number | null
          sponsor_id: string
          updated_at?: string
        }
        Update: {
          allowed_pages?: Json | null
          click_count?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_family_link?: boolean | null
          link_code?: string
          link_name?: string | null
          referral_code?: string
          registration_count?: number | null
          sponsor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          rejection_reason: string | null
          sponsor_approved: boolean | null
          sponsor_approved_at: string | null
          sponsor_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          rejection_reason?: string | null
          sponsor_approved?: boolean | null
          sponsor_approved_at?: string | null
          sponsor_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          rejection_reason?: string | null
          sponsor_approved?: boolean | null
          sponsor_approved_at?: string | null
          sponsor_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      single_use_invitation_codes: {
        Row: {
          code_name: string | null
          created_at: string
          id: string
          invitation_code: string
          is_active: boolean | null
          is_used: boolean | null
          updated_at: string
          used_at: string | null
          used_by: string | null
          user_id: string
        }
        Insert: {
          code_name?: string | null
          created_at?: string
          id?: string
          invitation_code: string
          is_active?: boolean | null
          is_used?: boolean | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
          user_id: string
        }
        Update: {
          code_name?: string | null
          created_at?: string
          id?: string
          invitation_code?: string
          is_active?: boolean | null
          is_used?: boolean | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
          user_id?: string
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
          image_url: string | null
          sport_type: string | null
          subtitle: string | null
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
          image_url?: string | null
          sport_type?: string | null
          subtitle?: string | null
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
          image_url?: string | null
          sport_type?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          bg_color_class: string
          border_color_class: string
          color_class: string
          created_at: string
          currency: string
          display_order: number
          icon_type: string
          id: string
          is_active: boolean
          name_ar: string
          name_de: string
          name_en: string
          name_es: string
          name_fr: string
          name_it: string
          name_ja: string
          name_pt: string
          name_ru: string
          name_zh: string
          price: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          tier_key: string
          updated_at: string
        }
        Insert: {
          bg_color_class?: string
          border_color_class?: string
          color_class?: string
          created_at?: string
          currency?: string
          display_order?: number
          icon_type?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_de: string
          name_en: string
          name_es: string
          name_fr: string
          name_it: string
          name_ja: string
          name_pt: string
          name_ru: string
          name_zh: string
          price: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tier_key: string
          updated_at?: string
        }
        Update: {
          bg_color_class?: string
          border_color_class?: string
          color_class?: string
          created_at?: string
          currency?: string
          display_order?: number
          icon_type?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_de?: string
          name_en?: string
          name_es?: string
          name_fr?: string
          name_it?: string
          name_ja?: string
          name_pt?: string
          name_ru?: string
          name_zh?: string
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tier_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      two_factor_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_document_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_document_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_document_id?: string | null
          title?: string
          type?: string
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
      verification_batches: {
        Row: {
          admin_id: string
          completed_at: string | null
          created_at: string
          error_count: number | null
          id: string
          rejected_count: number | null
          started_at: string | null
          status: string
          total_documents: number | null
          verified_count: number | null
        }
        Insert: {
          admin_id: string
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          id?: string
          rejected_count?: number | null
          started_at?: string | null
          status?: string
          total_documents?: number | null
          verified_count?: number | null
        }
        Update: {
          admin_id?: string
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          id?: string
          rejected_count?: number | null
          started_at?: string | null
          status?: string
          total_documents?: number | null
          verified_count?: number | null
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      member_discovery: {
        Row: {
          activity_domain: string | null
          avatar_url: string | null
          country: string | null
          first_name: string | null
          honorific_title: string | null
          id: string | null
          identity_verified: boolean | null
          is_founder: boolean | null
          last_name: string | null
        }
        Insert: {
          activity_domain?: string | null
          avatar_url?: string | null
          country?: string | null
          first_name?: string | null
          honorific_title?: string | null
          id?: string | null
          identity_verified?: boolean | null
          is_founder?: boolean | null
          last_name?: string | null
        }
        Update: {
          activity_domain?: string | null
          avatar_url?: string | null
          country?: string | null
          first_name?: string | null
          honorific_title?: string | null
          id?: string | null
          identity_verified?: boolean | null
          is_founder?: boolean | null
          last_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_sponsor_approval: {
        Args: { user_id_param: string }
        Returns: {
          needs_approval: boolean
          referral_id: string
          rejection_reason: string
          sponsor_approved: boolean
          sponsor_id: string
        }[]
      }
      cleanup_expired_2fa_codes: { Args: never; Returns: undefined }
      create_private_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      generate_account_number: { Args: never; Returns: string }
      generate_account_number_with_prefix: {
        Args: { p_is_linked_account: boolean }
        Returns: string
      }
      generate_referral_code: { Args: never; Returns: string }
      generate_referral_link_code: { Args: never; Returns: string }
      get_accessible_profile: {
        Args: { profile_id: string }
        Returns: {
          activity_domain: string
          avatar_url: string
          can_view_full: boolean
          country: string
          created_at: string
          first_name: string
          honorific_title: string
          id: string
          identity_verified: boolean
          is_founder: boolean
          is_linked_account: boolean
          job_function: string
          last_name: string
          linked_by_user_id: string
          personal_quote: string
          referral_code: string
          updated_at: string
          username: string
        }[]
      }
      get_members_wealth_for_badges: {
        Args: { member_ids: string[] }
        Returns: {
          user_id: string
          wealth_amount: string
          wealth_billions: string
          wealth_currency: string
          wealth_unit: string
        }[]
      }
      get_user_emails_for_admin: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
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
      mark_invitation_code_used: {
        Args: { code_id_param: string; used_by_param: string }
        Returns: boolean
      }
      validate_referral_code: {
        Args: { code: string }
        Returns: {
          is_valid: boolean
          sponsor_id: string
        }[]
      }
      validate_referral_link: {
        Args: { link_code_param: string }
        Returns: {
          is_family_link: boolean
          is_valid: boolean
          referral_code: string
          sponsor_id: string
        }[]
      }
      validate_single_use_invitation_code: {
        Args: { code_param: string }
        Returns: {
          code_id: string
          is_valid: boolean
          sponsor_id: string
        }[]
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
