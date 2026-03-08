export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          code: string;
          created_at: string;
          allow_debt: boolean;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          code: string;
          created_at?: string;
          allow_debt?: boolean;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          code?: string;
          created_at?: string;
          allow_debt?: boolean;
          is_active?: boolean;
        };
      };
      players: {
        Row: {
          id: string;
          room_id: string;
          name: string;
          balance: number;
          is_banker: boolean;
          is_bankrupt: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          name: string;
          balance?: number;
          is_banker?: boolean;
          is_bankrupt?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          name?: string;
          balance?: number;
          is_banker?: boolean;
          is_bankrupt?: boolean;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          room_id: string;
          from_player: string;
          to_player: string;
          amount: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          from_player: string;
          to_player: string;
          amount: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          from_player?: string;
          to_player?: string;
          amount?: number;
          description?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
