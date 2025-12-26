/**
 * Database types for Supabase
 * These types mirror the database schema and provide type safety
 */

export type MaterialRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "fulfilled";

export type MaterialRequestPriority = "low" | "medium" | "high" | "urgent";

export type MaterialUnit =
  | "kg"
  | "m"
  | "pieces"
  | "liters"
  | "tons"
  | "cubic_meters"
  | "square_meters";

export interface Database {
  public: {
    Tables: {
      material_requests: {
        Row: {
          id: string;
          project_id: string | null;
          material_name: string;
          quantity: number;
          unit: MaterialUnit;
          status: MaterialRequestStatus;
          priority: MaterialRequestPriority;
          requested_by: string;
          requested_at: string;
          notes: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          material_name: string;
          quantity: number;
          unit: MaterialUnit;
          status?: MaterialRequestStatus;
          priority: MaterialRequestPriority;
          requested_by?: string;
          requested_at?: string;
          notes?: string | null;
          company_id?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          material_name?: string;
          quantity?: number;
          unit?: MaterialUnit;
          status?: MaterialRequestStatus;
          priority?: MaterialRequestPriority;
          requested_by?: string;
          requested_at?: string;
          notes?: string | null;
          company_id?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          company_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          company_id?: string;
        };
        Update: {
          id?: string;
          name?: string;
          company_id?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_id: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_id?: string;
        };
      };
    };
  };
}

// Convenience type aliases
export type MaterialRequest =
  Database["public"]["Tables"]["material_requests"]["Row"];
export type MaterialRequestInsert =
  Database["public"]["Tables"]["material_requests"]["Insert"];
export type MaterialRequestUpdate =
  Database["public"]["Tables"]["material_requests"]["Update"];

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Extended types with relations
export interface MaterialRequestWithRelations extends MaterialRequest {
  requester?: Profile;
  project?: Project;
}
