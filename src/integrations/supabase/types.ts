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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          priority: string
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          priority?: string
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          priority?: string
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          file_url: string | null
          grade: string | null
          id: string
          student_id: string
          submitted_at: string
          teacher_feedback: string | null
          text_response: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          file_url?: string | null
          grade?: string | null
          id?: string
          student_id: string
          submitted_at?: string
          teacher_feedback?: string | null
          text_response?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          file_url?: string | null
          grade?: string | null
          id?: string
          student_id?: string
          submitted_at?: string
          teacher_feedback?: string | null
          text_response?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          absence_reason: string | null
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          absence_reason?: string | null
          class_id: string
          created_at?: string
          date: string
          id?: string
          marked_by: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          absence_reason?: string | null
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          class_id: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          published: boolean
          subject: string | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          published?: boolean
          subject?: string | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          published?: boolean
          subject?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount: number
          bank_name: string | null
          created_at: string
          id: string
          notes: string | null
          paid_at: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_url: string | null
          recorded_by: string
          reference_code: string | null
          student_fee_id: string
        }
        Insert: {
          amount?: number
          bank_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_url?: string | null
          recorded_by: string
          reference_code?: string | null
          student_fee_id: string
        }
        Update: {
          amount?: number
          bank_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_url?: string | null
          recorded_by?: string
          reference_code?: string | null
          student_fee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_student_fee_id_fkey"
            columns: ["student_fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year: string
          amount_per_term: number
          class_name: string
          created_at: string
          fee_categories: Json
          id: string
          lunch_fee: number
        }
        Insert: {
          academic_year?: string
          amount_per_term?: number
          class_name: string
          created_at?: string
          fee_categories?: Json
          id?: string
          lunch_fee?: number
        }
        Update: {
          academic_year?: string
          amount_per_term?: number
          class_name?: string
          created_at?: string
          fee_categories?: Json
          id?: string
          lunch_fee?: number
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          lesson_id: string
          student_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          lesson_id: string
          student_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          lesson_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          id: string
          pdf_url: string | null
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          id?: string
          pdf_url?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          id?: string
          pdf_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          active: boolean
          email: string
          id: string
          subscribed_at: string
        }
        Insert: {
          active?: boolean
          email: string
          id?: string
          subscribed_at?: string
        }
        Update: {
          active?: boolean
          email?: string
          id?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_by: string[]
          sender_id: string
          target_class_id: string | null
          target_role: string
          target_user_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_by?: string[]
          sender_id: string
          target_class_id?: string | null
          target_role?: string
          target_user_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_by?: string[]
          sender_id?: string
          target_class_id?: string | null
          target_role?: string
          target_user_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: []
      }
      parent_contacts: {
        Row: {
          child_grade: string | null
          child_name: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          parent_name: string
          phone: string | null
          student_id: string | null
        }
        Insert: {
          child_grade?: string | null
          child_name?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          parent_name: string
          phone?: string | null
          student_id?: string | null
        }
        Update: {
          child_grade?: string | null
          child_name?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          parent_name?: string
          phone?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean
          avatar_url: string | null
          class: string | null
          created_at: string
          full_name: string
          id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          class?: string | null
          created_at?: string
          full_name?: string
          id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          class?: string | null
          created_at?: string
          full_name?: string
          id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          id: string
          quiz_id: string
          score: number | null
          started_at: string
          student_id: string
          total_questions: number | null
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          id?: string
          quiz_id: string
          score?: number | null
          started_at?: string
          student_id: string
          total_questions?: number | null
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          id?: string
          quiz_id?: string
          score?: number | null
          started_at?: string
          student_id?: string
          total_questions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_feedback: {
        Row: {
          attempt_id: string
          created_at: string
          feedback: string
          id: string
          teacher_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          feedback: string
          id?: string
          teacher_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          feedback?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_feedback_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          explanation: string | null
          id: string
          options: Json
          question: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          correct_answer: number
          explanation?: string | null
          id?: string
          options?: Json
          question: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          correct_answer?: number
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          published: boolean
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          published?: boolean
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          published?: boolean
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fees: {
        Row: {
          academic_year: string
          balance: number
          created_at: string
          id: string
          mpesa_ref: string | null
          payment_date: string | null
          student_id: string
          term: string
          total_expected: number
          total_paid: number
          updated_at: string
        }
        Insert: {
          academic_year?: string
          balance?: number
          created_at?: string
          id?: string
          mpesa_ref?: string | null
          payment_date?: string | null
          student_id: string
          term?: string
          total_expected?: number
          total_paid?: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          balance?: number
          created_at?: string
          id?: string
          mpesa_ref?: string | null
          payment_date?: string | null
          student_id?: string
          term?: string
          total_expected?: number
          total_paid?: number
          updated_at?: string
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
      get_quiz_questions_for_student: {
        Args: { _quiz_id: string }
        Returns: {
          explanation: string
          id: string
          options: Json
          question: string
          quiz_id: string
          sort_order: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
      attendance_status: "present" | "absent" | "late"
      notification_type: "fee" | "quiz" | "general"
      payment_method: "mpesa" | "bank" | "cash"
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
      app_role: ["student", "teacher", "admin"],
      attendance_status: ["present", "absent", "late"],
      notification_type: ["fee", "quiz", "general"],
      payment_method: ["mpesa", "bank", "cash"],
    },
  },
} as const
