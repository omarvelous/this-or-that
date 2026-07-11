// Auto-generated with `npm run db:types` (supabase gen types typescript --local).
// Do not edit by hand — run `supabase db reset && npm run db:types` to regenerate.

export type Database = {
  public: {
    Tables: {
      users: {
        Relationships: [];
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          plan: Database["public"]["Enums"]["plan"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: Database["public"]["Enums"]["plan"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: Database["public"]["Enums"]["plan"];
          updated_at?: string;
        };
      };
      polls: {
        Relationships: [];
        Row: {
          id: string;
          short_id: string;
          creator_id: string;
          question: string;
          closes_at: string | null;
          published_at: string | null;
          closed_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          short_id: string;
          creator_id: string;
          question: string;
          closes_at?: string | null;
          published_at?: string | null;
          closed_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          short_id?: string;
          creator_id?: string;
          question?: string;
          closes_at?: string | null;
          published_at?: string | null;
          closed_at?: string | null;
          deleted_at?: string | null;
          updated_at?: string;
        };
      };
      options: {
        Relationships: [];
        Row: {
          id: string;
          poll_id: string;
          label: string | null;
          image_url: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          label?: string | null;
          image_url?: string | null;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          label?: string | null;
          image_url?: string | null;
          position?: number;
        };
      };
      matchups: {
        Relationships: [];
        Row: {
          id: string;
          poll_id: string;
          round: number;
          option_a_id: string | null;
          option_b_id: string | null;
          winner_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          round: number;
          option_a_id?: string | null;
          option_b_id?: string | null;
          winner_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          round?: number;
          option_a_id?: string | null;
          option_b_id?: string | null;
          winner_id?: string | null;
        };
      };
      votes: {
        Relationships: [];
        Row: {
          id: string;
          poll_id: string;
          option_id: string;
          matchup_id: string;
          voter_name: string | null;
          fingerprint: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          option_id: string;
          matchup_id: string;
          voter_name?: string | null;
          fingerprint: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          option_id?: string;
          matchup_id?: string;
          voter_name?: string | null;
          fingerprint?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      plan: "free" | "pro";
    };
  };
};

// Convenience helpers — mirror what `supabase gen types` produces.
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
