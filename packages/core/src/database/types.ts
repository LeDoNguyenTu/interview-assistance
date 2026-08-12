export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          byte_size: number;
          created_at: string;
          extracted_text: string | null;
          id: string;
          media_type: string;
          original_filename: string;
          status: string;
          storage_path: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          byte_size: number;
          created_at?: string;
          extracted_text?: string | null;
          id?: string;
          media_type: string;
          original_filename: string;
          status?: string;
          storage_path: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          byte_size?: number;
          created_at?: string;
          extracted_text?: string | null;
          id?: string;
          media_type?: string;
          original_filename?: string;
          status?: string;
          storage_path?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      guidance_events: {
        Row: {
          created_at: string;
          id: string;
          idempotency_key: string;
          input_tokens: number;
          latency_ms: number;
          model: string;
          output_tokens: number;
          provider: string;
          question_id: string | null;
          result: Json;
          session_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          idempotency_key: string;
          input_tokens?: number;
          latency_ms: number;
          model: string;
          output_tokens?: number;
          provider: string;
          question_id?: string | null;
          result?: Json;
          session_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          input_tokens?: number;
          latency_ms?: number;
          model?: string;
          output_tokens?: number;
          provider?: string;
          question_id?: string | null;
          result?: Json;
          session_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'guidance_events_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'guidance_events_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      interview_profiles: {
        Row: {
          company_context: string | null;
          created_at: string;
          document_ids: string[];
          id: string;
          instructions: string | null;
          target_role: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          company_context?: string | null;
          created_at?: string;
          document_ids?: string[];
          id?: string;
          instructions?: string | null;
          target_role?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          company_context?: string | null;
          created_at?: string;
          document_ids?: string[];
          id?: string;
          instructions?: string | null;
          target_role?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          default_provider: string;
          display_name: string;
          id: string;
          locale: string;
          preferences: Json;
          recording_default: boolean;
          retention_days: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          default_provider?: string;
          display_name?: string;
          id?: string;
          locale?: string;
          preferences?: Json;
          recording_default?: boolean;
          retention_days?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          default_provider?: string;
          display_name?: string;
          id?: string;
          locale?: string;
          preferences?: Json;
          recording_default?: boolean;
          retention_days?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          confidence: number | null;
          context: string | null;
          created_at: string;
          detected_ms: number;
          id: string;
          session_id: string;
          source_utterance_ids: string[];
          text: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          confidence?: number | null;
          context?: string | null;
          created_at?: string;
          detected_ms: number;
          id?: string;
          session_id: string;
          source_utterance_ids?: string[];
          text: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          confidence?: number | null;
          context?: string | null;
          created_at?: string;
          detected_ms?: number;
          id?: string;
          session_id?: string;
          source_utterance_ids?: string[];
          text?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      recordings: {
        Row: {
          byte_size: number;
          checksum: string | null;
          created_at: string;
          duration_ms: number;
          id: string;
          media_type: string;
          session_id: string;
          source: string;
          storage_path: string;
          updated_at: string;
          upload_status: string;
          user_id: string;
        };
        Insert: {
          byte_size: number;
          checksum?: string | null;
          created_at?: string;
          duration_ms?: number;
          id?: string;
          media_type: string;
          session_id: string;
          source: string;
          storage_path: string;
          updated_at?: string;
          upload_status?: string;
          user_id: string;
        };
        Update: {
          byte_size?: number;
          checksum?: string | null;
          created_at?: string;
          duration_ms?: number;
          id?: string;
          media_type?: string;
          session_id?: string;
          source?: string;
          storage_path?: string;
          updated_at?: string;
          upload_status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recordings_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          id: string;
          idempotency_key: string;
          report_type: string;
          result: Json;
          schema_version: string;
          session_id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          idempotency_key: string;
          report_type: string;
          result?: Json;
          schema_version: string;
          session_id: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          report_type?: string;
          result?: Json;
          schema_version?: string;
          session_id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      sessions: {
        Row: {
          capture_sources: string[];
          consent_version: string | null;
          consented_at: string | null;
          created_at: string;
          ended_at: string | null;
          id: string;
          interview_profile_id: string | null;
          mode: string;
          platform: string;
          provider: string;
          recording_enabled: boolean;
          started_at: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          capture_sources?: string[];
          consent_version?: string | null;
          consented_at?: string | null;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          interview_profile_id?: string | null;
          mode: string;
          platform: string;
          provider?: string;
          recording_enabled?: boolean;
          started_at?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          capture_sources?: string[];
          consent_version?: string | null;
          consented_at?: string | null;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          interview_profile_id?: string | null;
          mode?: string;
          platform?: string;
          provider?: string;
          recording_enabled?: boolean;
          started_at?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_interview_profile_id_fkey';
            columns: ['interview_profile_id'];
            isOneToOne: false;
            referencedRelation: 'interview_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      usage_events: {
        Row: {
          audio_ms: number;
          created_at: string;
          error_category: string | null;
          id: string;
          input_tokens: number;
          latency_ms: number;
          model: string | null;
          operation: string;
          output_tokens: number;
          provider: string;
          session_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          audio_ms?: number;
          created_at?: string;
          error_category?: string | null;
          id?: string;
          input_tokens?: number;
          latency_ms?: number;
          model?: string | null;
          operation: string;
          output_tokens?: number;
          provider: string;
          session_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          audio_ms?: number;
          created_at?: string;
          error_category?: string | null;
          id?: string;
          input_tokens?: number;
          latency_ms?: number;
          model?: string | null;
          operation?: string;
          output_tokens?: number;
          provider?: string;
          session_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'usage_events_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      utterances: {
        Row: {
          confidence: number | null;
          created_at: string;
          end_ms: number;
          id: string;
          is_final: boolean;
          sequence: number;
          session_id: string;
          speaker: string;
          start_ms: number;
          text: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string;
          end_ms: number;
          id?: string;
          is_final?: boolean;
          sequence: number;
          session_id: string;
          speaker: string;
          start_ms: number;
          text?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          confidence?: number | null;
          created_at?: string;
          end_ms?: number;
          id?: string;
          is_final?: boolean;
          sequence?: number;
          session_id?: string;
          speaker?: string;
          start_ms?: number;
          text?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'utterances_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
