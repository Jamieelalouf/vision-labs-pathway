export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "student" | "admin";
export type LanguagePref = "en" | "fr";
export type CohortStatus = "draft" | "open" | "active" | "completed" | "cancelled";
export type RegistrationStatus = "open" | "closed" | "full";
export type EnrollmentStatus =
  | "pending"
  | "registered"
  | "completed"
  | "dropped"
  | "refunded"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PriceType = "regular" | "returning" | "manual";
export type AttendanceStatus = "present" | "absent" | "excused" | "unmarked";
export type RewardTier = "member" | "alumni" | "elite" | "legacy";
export type RewardStatus = "locked" | "unlocked" | "generated" | "redeemed" | "expired";
export type DiscountType = "convention" | "labs";
export type DiscountCodeStatus = "active" | "used" | "expired" | "cancelled";
export type VideoSource = "upload" | "external_link";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          language_pref: LanguagePref;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          language_pref?: LanguagePref;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      dancers: {
        Row: {
          id: string;
          profile_id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          instagram_handle: string | null;
          date_of_birth: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          guardian_name: string | null;
          guardian_email: string | null;
          guardian_phone: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          instagram_handle?: string | null;
          date_of_birth?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          guardian_name?: string | null;
          guardian_email?: string | null;
          guardian_phone?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dancers"]["Insert"]>;
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          convention_name: string | null;
          convention_start_date: string | null;
          convention_end_date: string | null;
          weekend_pass_value_cad: number;
          all_access_pass_value_cad: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["seasons"]["Row"]> & {
          name: string;
          start_date: string;
          end_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["seasons"]["Insert"]>;
        Relationships: [];
      };
      cohorts: {
        Row: {
          id: string;
          season_id: string;
          name: string;
          cohort_number: number;
          start_date: string;
          end_date: string;
          day_of_week: number | null;
          start_time: string;
          end_time: string;
          location_name: string;
          location_address: string;
          capacity: number;
          registration_status: RegistrationStatus;
          status: CohortStatus;
          regular_price_cad: number;
          returning_price_cad: number;
          description_en: string | null;
          description_fr: string | null;
          stripe_product_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cohorts"]["Row"]> & {
          season_id: string;
          name: string;
          cohort_number: number;
          start_date: string;
          end_date: string;
          start_time: string;
          end_time: string;
          location_name: string;
          location_address: string;
          capacity: number;
        };
        Update: Partial<Database["public"]["Tables"]["cohorts"]["Insert"]>;
        Relationships: [];
      };
      cohort_sessions: {
        Row: {
          id: string;
          cohort_id: string;
          session_number: number;
          session_date: string;
          start_time: string;
          end_time: string;
          theme_en: string | null;
          theme_fr: string | null;
          notes_en: string | null;
          notes_fr: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cohort_sessions"]["Row"]> & {
          cohort_id: string;
          session_number: number;
          session_date: string;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["cohort_sessions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "cohort_sessions_cohort_id_fkey";
            columns: ["cohort_id"];
            isOneToOne: false;
            referencedRelation: "cohorts";
            referencedColumns: ["id"];
          }
        ];
      };
      enrollments: {
        Row: {
          id: string;
          dancer_id: string;
          cohort_id: string;
          season_id: string;
          price_type: PriceType;
          price_paid_cad: number;
          payment_status: PaymentStatus;
          enrollment_status: EnrollmentStatus;
          completion_status: "completed" | "incomplete" | null;
          completion_overridden: boolean;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          amount_refunded_cad: number;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["enrollments"]["Row"]> & {
          dancer_id: string;
          cohort_id: string;
          season_id: string;
          price_type: PriceType;
          price_paid_cad: number;
        };
        Update: Partial<Database["public"]["Tables"]["enrollments"]["Insert"]>;
        Relationships: [];
      };
      reward_levels: {
        Row: {
          tier: RewardTier;
          cohorts_required: number;
          status_label_en: string;
          status_label_fr: string;
          reward_label_en: string;
          reward_label_fr: string;
          discount_amount_cad: number | null;
          is_free_pass: boolean;
        };
        Insert: Database["public"]["Tables"]["reward_levels"]["Row"];
        Update: Partial<Database["public"]["Tables"]["reward_levels"]["Row"]>;
        Relationships: [];
      };
      discount_codes: {
        Row: {
          id: string;
          code: string;
          dancer_id: string;
          season_id: string;
          type: DiscountType;
          amount_cad: number | null;
          is_free_pass: boolean;
          status: DiscountCodeStatus;
          stripe_coupon_id: string | null;
          stripe_promotion_code_id: string | null;
          stackable: boolean;
          issued_at: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["discount_codes"]["Row"]> & {
          code: string;
          dancer_id: string;
          season_id: string;
          type: DiscountType;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["discount_codes"]["Insert"]>;
        Relationships: [];
      };
      dancer_rewards: {
        Row: {
          id: string;
          dancer_id: string;
          season_id: string;
          tier: RewardTier;
          status: RewardStatus;
          cohorts_completed_count: number;
          discount_code_id: string | null;
          unlocked_at: string;
          generated_at: string | null;
          redeemed_at: string | null;
          expires_at: string | null;
          manually_granted: boolean;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["dancer_rewards"]["Row"]> & {
          dancer_id: string;
          season_id: string;
          tier: RewardTier;
          cohorts_completed_count: number;
          unlocked_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dancer_rewards"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      language_pref: LanguagePref;
      cohort_status: CohortStatus;
      registration_status: RegistrationStatus;
      enrollment_status: EnrollmentStatus;
      payment_status: PaymentStatus;
      price_type: PriceType;
      attendance_status: AttendanceStatus;
      reward_tier: RewardTier;
      reward_status: RewardStatus;
      discount_type: DiscountType;
      discount_code_status: DiscountCodeStatus;
      video_source: VideoSource;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
