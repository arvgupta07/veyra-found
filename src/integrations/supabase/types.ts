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
      assessments: {
        Row: {
          agreeableness_score: number | null
          completed_at: string | null
          conscientiousness_score: number | null
          decision_velocity_score: number | null
          equity_philosophy_score: number | null
          extraversion_score: number | null
          founder_id: string
          id: string
          neuroticism_score: number | null
          openness_score: number | null
          raw_answers: Json | null
          risk_score: number | null
          vision_score: number | null
        }
        Insert: {
          agreeableness_score?: number | null
          completed_at?: string | null
          conscientiousness_score?: number | null
          decision_velocity_score?: number | null
          equity_philosophy_score?: number | null
          extraversion_score?: number | null
          founder_id: string
          id?: string
          neuroticism_score?: number | null
          openness_score?: number | null
          raw_answers?: Json | null
          risk_score?: number | null
          vision_score?: number | null
        }
        Update: {
          agreeableness_score?: number | null
          completed_at?: string | null
          conscientiousness_score?: number | null
          decision_velocity_score?: number | null
          equity_philosophy_score?: number | null
          extraversion_score?: number | null
          founder_id?: string
          id?: string
          neuroticism_score?: number | null
          openness_score?: number | null
          raw_answers?: Json | null
          risk_score?: number | null
          vision_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: true
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_reports: {
        Row: {
          alignment_points: Json | null
          compatibility_score: number | null
          conversation_id: string
          conversation_starters: Json | null
          divergence_points: Json | null
          generated_at: string | null
          id: string
          rationale_summary: string | null
          risk_flags: Json | null
        }
        Insert: {
          alignment_points?: Json | null
          compatibility_score?: number | null
          conversation_id: string
          conversation_starters?: Json | null
          divergence_points?: Json | null
          generated_at?: string | null
          id?: string
          rationale_summary?: string | null
          risk_flags?: Json | null
        }
        Update: {
          alignment_points?: Json | null
          compatibility_score?: number | null
          conversation_id?: string
          conversation_starters?: Json | null
          divergence_points?: Json | null
          generated_at?: string | null
          id?: string
          rationale_summary?: string | null
          risk_flags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "compatibility_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          created_at: string
          from_founder_id: string
          id: string
          message: string | null
          prompt_question: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          to_founder_id: string
        }
        Insert: {
          created_at?: string
          from_founder_id: string
          id?: string
          message?: string | null
          prompt_question?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          to_founder_id: string
        }
        Update: {
          created_at?: string
          from_founder_id?: string
          id?: string
          message?: string | null
          prompt_question?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          to_founder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_from_founder_id_fkey"
            columns: ["from_founder_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_to_founder_id_fkey"
            columns: ["to_founder_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_labels: {
        Row: {
          color: string | null
          conversation_id: string
          created_at: string | null
          founder_id: string
          id: string
          label: string
        }
        Insert: {
          color?: string | null
          conversation_id: string
          created_at?: string | null
          founder_id: string
          id?: string
          label: string
        }
        Update: {
          color?: string | null
          conversation_id?: string
          created_at?: string | null
          founder_id?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_labels_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_labels_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          founder_a_id: string
          founder_b_id: string
          id: string
          request_id: string | null
          stage: Database["public"]["Enums"]["convo_stage"] | null
        }
        Insert: {
          created_at?: string
          founder_a_id: string
          founder_b_id: string
          id?: string
          request_id?: string | null
          stage?: Database["public"]["Enums"]["convo_stage"] | null
        }
        Update: {
          created_at?: string
          founder_a_id?: string
          founder_b_id?: string
          id?: string
          request_id?: string | null
          stage?: Database["public"]["Enums"]["convo_stage"] | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_founder_a_id_fkey"
            columns: ["founder_a_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_founder_b_id_fkey"
            columns: ["founder_b_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "connection_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          upvotes: number | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          upvotes?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          category: Database["public"]["Enums"]["forum_category"] | null
          content: string
          created_at: string
          id: string
          industry_tag: string | null
          is_pinned: boolean | null
          seeking_feedback: boolean
          title: string
          updated_at: string
          upvotes: number | null
        }
        Insert: {
          author_id: string
          category?: Database["public"]["Enums"]["forum_category"] | null
          content: string
          created_at?: string
          id?: string
          industry_tag?: string | null
          is_pinned?: boolean | null
          seeking_feedback?: boolean
          title: string
          updated_at?: string
          upvotes?: number | null
        }
        Update: {
          author_id?: string
          category?: Database["public"]["Enums"]["forum_category"] | null
          content?: string
          created_at?: string
          id?: string
          industry_tag?: string | null
          is_pinned?: boolean | null
          seeking_feedback?: boolean
          title?: string
          updated_at?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_saves: {
        Row: {
          founder_id: string
          post_id: string
        }
        Insert: {
          founder_id: string
          post_id: string
        }
        Update: {
          founder_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_saves_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_upvotes: {
        Row: {
          founder_id: string
          post_id: string
        }
        Insert: {
          founder_id: string
          post_id: string
        }
        Update: {
          founder_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_upvotes_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_upvotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_prompts: {
        Row: {
          display_order: number | null
          founder_id: string
          id: string
          prompt_answer: string
          prompt_question: string
        }
        Insert: {
          display_order?: number | null
          founder_id: string
          id?: string
          prompt_answer: string
          prompt_question: string
        }
        Update: {
          display_order?: number | null
          founder_id?: string
          id?: string
          prompt_answer?: string
          prompt_question?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_prompts_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
        ]
      }
      founders: {
        Row: {
          aadhaar_verified: boolean | null
          active_status: Database["public"]["Enums"]["founder_active"] | null
          age: number | null
          background: Database["public"]["Enums"]["founder_background"] | null
          bio: string | null
          commitment: Database["public"]["Enums"]["founder_commitment"] | null
          created_at: string
          education: string | null
          equity_offer: string | null
          exit_vision: Database["public"]["Enums"]["founder_exit"] | null
          github_url: string | null
          github_verified: boolean | null
          has_idea: boolean | null
          headline: string | null
          id: string
          idea_description: string | null
          idea_industry: string | null
          idea_stage: Database["public"]["Enums"]["founder_stage"] | null
          industry_focus: string[] | null
          linkedin_url: string | null
          linkedin_verified: boolean | null
          location: string | null
          looking_for: string[]
          profile_complete: boolean | null
          remote_pref: Database["public"]["Enums"]["remote_pref"] | null
          seed_avatar: string | null
          seed_name: string | null
          skills: string[] | null
          trust_tier: Database["public"]["Enums"]["trust_tier"] | null
          user_id: string | null
          video_intro_url: string | null
          vouches_count: number | null
          years_experience: number | null
        }
        Insert: {
          aadhaar_verified?: boolean | null
          active_status?: Database["public"]["Enums"]["founder_active"] | null
          age?: number | null
          background?: Database["public"]["Enums"]["founder_background"] | null
          bio?: string | null
          commitment?: Database["public"]["Enums"]["founder_commitment"] | null
          created_at?: string
          education?: string | null
          equity_offer?: string | null
          exit_vision?: Database["public"]["Enums"]["founder_exit"] | null
          github_url?: string | null
          github_verified?: boolean | null
          has_idea?: boolean | null
          headline?: string | null
          id?: string
          idea_description?: string | null
          idea_industry?: string | null
          idea_stage?: Database["public"]["Enums"]["founder_stage"] | null
          industry_focus?: string[] | null
          linkedin_url?: string | null
          linkedin_verified?: boolean | null
          location?: string | null
          looking_for?: string[]
          profile_complete?: boolean | null
          remote_pref?: Database["public"]["Enums"]["remote_pref"] | null
          seed_avatar?: string | null
          seed_name?: string | null
          skills?: string[] | null
          trust_tier?: Database["public"]["Enums"]["trust_tier"] | null
          user_id?: string | null
          video_intro_url?: string | null
          vouches_count?: number | null
          years_experience?: number | null
        }
        Update: {
          aadhaar_verified?: boolean | null
          active_status?: Database["public"]["Enums"]["founder_active"] | null
          age?: number | null
          background?: Database["public"]["Enums"]["founder_background"] | null
          bio?: string | null
          commitment?: Database["public"]["Enums"]["founder_commitment"] | null
          created_at?: string
          education?: string | null
          equity_offer?: string | null
          exit_vision?: Database["public"]["Enums"]["founder_exit"] | null
          github_url?: string | null
          github_verified?: boolean | null
          has_idea?: boolean | null
          headline?: string | null
          id?: string
          idea_description?: string | null
          idea_industry?: string | null
          idea_stage?: Database["public"]["Enums"]["founder_stage"] | null
          industry_focus?: string[] | null
          linkedin_url?: string | null
          linkedin_verified?: boolean | null
          location?: string | null
          looking_for?: string[]
          profile_complete?: boolean | null
          remote_pref?: Database["public"]["Enums"]["remote_pref"] | null
          seed_avatar?: string | null
          seed_name?: string | null
          skills?: string[] | null
          trust_tier?: Database["public"]["Enums"]["trust_tier"] | null
          user_id?: string | null
          video_intro_url?: string | null
          vouches_count?: number | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "founders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_feed_listings: {
        Row: {
          active: boolean | null
          conversation_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          idea_oneliner: string | null
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          pitch_video_url: string | null
          raise_amount: string | null
          raise_purpose: string | null
          traction_metrics: string | null
          views: number | null
        }
        Insert: {
          active?: boolean | null
          conversation_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          idea_oneliner?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          pitch_video_url?: string | null
          raise_amount?: string | null
          raise_purpose?: string | null
          traction_metrics?: string | null
          views?: number | null
        }
        Update: {
          active?: boolean | null
          conversation_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          idea_oneliner?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          pitch_video_url?: string | null
          raise_amount?: string | null
          raise_purpose?: string | null
          traction_metrics?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_feed_listings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_interests: {
        Row: {
          created_at: string
          id: string
          interested: boolean | null
          investor_id: string
          listing_id: string
          saved: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          interested?: boolean | null
          investor_id: string
          listing_id: string
          saved?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          interested?: boolean | null
          investor_id?: string
          listing_id?: string
          saved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_interests_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_interests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "investor_feed_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_profiles: {
        Row: {
          check_size_max: number | null
          check_size_min: number | null
          created_at: string
          fund_name: string | null
          id: string
          industries: string[] | null
          thesis: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string
          fund_name?: string | null
          id?: string
          industries?: string[] | null
          thesis?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string
          fund_name?: string | null
          id?: string
          industries?: string[] | null
          thesis?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
          read: boolean | null
          seed_sender_founder_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean | null
          seed_sender_founder_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean | null
          seed_sender_founder_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_seed_sender_founder_id_fkey"
            columns: ["seed_sender_founder_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      past_ventures: {
        Row: {
          company_name: string | null
          description: string | null
          founder_id: string
          id: string
          linkedin_verified: boolean | null
          outcome: Database["public"]["Enums"]["venture_outcome"] | null
        }
        Insert: {
          company_name?: string | null
          description?: string | null
          founder_id: string
          id?: string
          linkedin_verified?: boolean | null
          outcome?: Database["public"]["Enums"]["venture_outcome"] | null
        }
        Update: {
          company_name?: string | null
          description?: string | null
          founder_id?: string
          id?: string
          linkedin_verified?: boolean | null
          outcome?: Database["public"]["Enums"]["venture_outcome"] | null
        }
        Relationships: [
          {
            foreignKeyName: "past_ventures_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_pro: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_pro?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_pro?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      vouches: {
        Row: {
          accepted: boolean | null
          context: string | null
          created_at: string
          id: string
          skill_tag: string | null
          vouchee_id: string
          voucher_id: string
        }
        Insert: {
          accepted?: boolean | null
          context?: string | null
          created_at?: string
          id?: string
          skill_tag?: string | null
          vouchee_id: string
          voucher_id: string
        }
        Update: {
          accepted?: boolean | null
          context?: string | null
          created_at?: string
          id?: string
          skill_tag?: string | null
          vouchee_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouches_vouchee_id_fkey"
            columns: ["vouchee_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouches_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_demo_founder: { Args: { target: string }; Returns: string }
      current_founder_id: { Args: never; Returns: string }
    }
    Enums: {
      convo_stage: "talking" | "intro_call" | "trial_project" | "confirmed"
      forum_category:
        | "idea_validation"
        | "looking_for_cofounder"
        | "industry_talk"
        | "resources"
        | "success_stories"
      founder_active: "active" | "open" | "paused"
      founder_background: "technical" | "business" | "design" | "other"
      founder_commitment: "full_time" | "part_time" | "exploring"
      founder_exit: "lifestyle" | "acquisition" | "ipo"
      founder_stage: "idea" | "mvp" | "revenue" | "funded"
      listing_type: "standard" | "featured"
      remote_pref: "onsite" | "hybrid" | "remote"
      request_status: "pending" | "accepted" | "declined" | "withdrawn"
      trust_tier: "Builder" | "Maker" | "Veteran"
      user_role: "founder" | "investor"
      venture_outcome: "running" | "exited" | "shut_down"
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
      convo_stage: ["talking", "intro_call", "trial_project", "confirmed"],
      forum_category: [
        "idea_validation",
        "looking_for_cofounder",
        "industry_talk",
        "resources",
        "success_stories",
      ],
      founder_active: ["active", "open", "paused"],
      founder_background: ["technical", "business", "design", "other"],
      founder_commitment: ["full_time", "part_time", "exploring"],
      founder_exit: ["lifestyle", "acquisition", "ipo"],
      founder_stage: ["idea", "mvp", "revenue", "funded"],
      listing_type: ["standard", "featured"],
      remote_pref: ["onsite", "hybrid", "remote"],
      request_status: ["pending", "accepted", "declined", "withdrawn"],
      trust_tier: ["Builder", "Maker", "Veteran"],
      user_role: ["founder", "investor"],
      venture_outcome: ["running", "exited", "shut_down"],
    },
  },
} as const
