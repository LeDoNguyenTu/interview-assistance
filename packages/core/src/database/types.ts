export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type FoundationRow = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

type FoundationInsert = Partial<FoundationRow> & { user_id: string };
type FoundationUpdate = Partial<FoundationInsert>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: FoundationRow & {
          display_name: string;
          locale: string;
          default_provider: string;
          retention_days: number;
          recording_default: boolean;
          preferences: Json;
        };
        Insert: FoundationInsert &
          Partial<{
            display_name: string;
            locale: string;
            default_provider: string;
            retention_days: number;
            recording_default: boolean;
            preferences: Json;
          }>;
        Update: FoundationUpdate &
          Partial<{
            display_name: string;
            locale: string;
            default_provider: string;
            retention_days: number;
            recording_default: boolean;
            preferences: Json;
          }>;
      };
      documents: {
        Row: FoundationRow & {
          storage_path: string;
          original_filename: string;
          media_type: string;
          byte_size: number;
          status: string;
          extracted_text: string | null;
        };
        Insert: FoundationInsert & {
          storage_path: string;
          original_filename: string;
          media_type: string;
          byte_size: number;
        } & Partial<{ status: string; extracted_text: string | null }>;
        Update: FoundationUpdate &
          Partial<{
            storage_path: string;
            original_filename: string;
            media_type: string;
            byte_size: number;
            status: string;
            extracted_text: string | null;
          }>;
      };
      interview_profiles: {
        Row: FoundationRow & {
          title: string;
          target_role: string | null;
          company_context: string | null;
          instructions: string | null;
          document_ids: string[];
        };
        Insert: FoundationInsert & { title: string } & Partial<{
            target_role: string | null;
            company_context: string | null;
            instructions: string | null;
            document_ids: string[];
          }>;
        Update: FoundationUpdate &
          Partial<{
            title: string;
            target_role: string | null;
            company_context: string | null;
            instructions: string | null;
            document_ids: string[];
          }>;
      };
      sessions: {
        Row: FoundationRow & {
          interview_profile_id: string | null;
          mode: string;
          status: string;
          provider: string;
          platform: string;
          capture_sources: string[];
          recording_enabled: boolean;
          title: string;
          consent_version: string | null;
          consented_at: string | null;
          started_at: string | null;
          ended_at: string | null;
        };
        Insert: FoundationInsert & {
          mode: string;
          platform: string;
          title: string;
        } & Partial<{
            interview_profile_id: string | null;
            status: string;
            provider: string;
            capture_sources: string[];
            recording_enabled: boolean;
            consent_version: string | null;
            consented_at: string | null;
            started_at: string | null;
            ended_at: string | null;
          }>;
        Update: FoundationUpdate &
          Partial<{
            interview_profile_id: string | null;
            mode: string;
            status: string;
            provider: string;
            platform: string;
            capture_sources: string[];
            recording_enabled: boolean;
            title: string;
            consent_version: string | null;
            consented_at: string | null;
            started_at: string | null;
            ended_at: string | null;
          }>;
      };
      recordings: {
        Row: FoundationRow & {
          session_id: string;
          source: string;
          storage_path: string;
          media_type: string;
          byte_size: number;
          duration_ms: number;
          checksum: string | null;
          upload_status: string;
        };
        Insert: FoundationInsert & {
          session_id: string;
          source: string;
          storage_path: string;
          media_type: string;
          byte_size: number;
        } & Partial<{
            duration_ms: number;
            checksum: string | null;
            upload_status: string;
          }>;
        Update: FoundationUpdate &
          Partial<{
            session_id: string;
            source: string;
            storage_path: string;
            media_type: string;
            byte_size: number;
            duration_ms: number;
            checksum: string | null;
            upload_status: string;
          }>;
      };
      utterances: {
        Row: FoundationRow & {
          session_id: string;
          sequence: number;
          speaker: string;
          text: string;
          start_ms: number;
          end_ms: number;
          is_final: boolean;
          confidence: number | null;
        };
        Insert: FoundationInsert & {
          session_id: string;
          sequence: number;
          speaker: string;
          text: string;
          start_ms: number;
          end_ms: number;
        } & Partial<{ is_final: boolean; confidence: number | null }>;
        Update: FoundationUpdate &
          Partial<{
            session_id: string;
            sequence: number;
            speaker: string;
            text: string;
            start_ms: number;
            end_ms: number;
            is_final: boolean;
            confidence: number | null;
          }>;
      };
      questions: {
        Row: FoundationRow & {
          session_id: string;
          source_utterance_ids: string[];
          text: string;
          context: string | null;
          detected_ms: number;
          confidence: number | null;
        };
        Insert: FoundationInsert & {
          session_id: string;
          text: string;
          detected_ms: number;
        } & Partial<{
            source_utterance_ids: string[];
            context: string | null;
            confidence: number | null;
          }>;
        Update: FoundationUpdate &
          Partial<{
            session_id: string;
            source_utterance_ids: string[];
            text: string;
            context: string | null;
            detected_ms: number;
            confidence: number | null;
          }>;
      };
      guidance_events: {
        Row: FoundationRow & {
          session_id: string;
          question_id: string | null;
          provider: string;
          model: string;
          result: Json;
          latency_ms: number;
          input_tokens: number;
          output_tokens: number;
          idempotency_key: string;
        };
        Insert: FoundationInsert & {
          session_id: string;
          provider: string;
          model: string;
          latency_ms: number;
          idempotency_key: string;
        } & Partial<{
            question_id: string | null;
            result: Json;
            input_tokens: number;
            output_tokens: number;
          }>;
        Update: FoundationUpdate &
          Partial<{
            session_id: string;
            question_id: string | null;
            provider: string;
            model: string;
            result: Json;
            latency_ms: number;
            input_tokens: number;
            output_tokens: number;
            idempotency_key: string;
          }>;
      };
      reports: {
        Row: FoundationRow & {
          session_id: string;
          report_type: string;
          status: string;
          schema_version: string;
          result: Json;
          idempotency_key: string;
        };
        Insert: FoundationInsert & {
          session_id: string;
          report_type: string;
          schema_version: string;
          idempotency_key: string;
        } & Partial<{ status: string; result: Json }>;
        Update: FoundationUpdate &
          Partial<{
            session_id: string;
            report_type: string;
            status: string;
            schema_version: string;
            result: Json;
            idempotency_key: string;
          }>;
      };
      usage_events: {
        Row: FoundationRow & {
          session_id: string | null;
          provider: string;
          operation: string;
          model: string | null;
          latency_ms: number;
          input_tokens: number;
          output_tokens: number;
          audio_ms: number;
          error_category: string | null;
        };
        Insert: FoundationInsert & {
          provider: string;
          operation: string;
        } & Partial<{
            session_id: string | null;
            model: string | null;
            latency_ms: number;
            input_tokens: number;
            output_tokens: number;
            audio_ms: number;
            error_category: string | null;
          }>;
        Update: FoundationUpdate &
          Partial<{
            session_id: string | null;
            provider: string;
            operation: string;
            model: string | null;
            latency_ms: number;
            input_tokens: number;
            output_tokens: number;
            audio_ms: number;
            error_category: string | null;
          }>;
      };
    };
  };
}
