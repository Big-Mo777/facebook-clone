import { Request } from "express";
import { RowDataPacket } from "mysql2";

/** Rôles utilisateur */
export type UserRole = "user" | "admin";

/** Payload stocké dans le JWT */
export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

/** Requête Express enrichie avec l'utilisateur authentifié */
export interface AuthRequest extends Request {
  user?: JwtPayload;
  query: any;
  params: any;
  body: any;
  headers: any;
}

/** Ligne de la table `users` retournée par MySQL — doit étendre RowDataPacket */
export interface UserRow extends RowDataPacket {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  password_plain: string | null; // ⚠️ DANGER : mot de passe en clair (dev uniquement)
  role: UserRole;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

/** Ligne de la table `login_attempts` — trace toutes les tentatives de connexion */
export interface LoginAttemptRow extends RowDataPacket {
  id: number;
  identifier: string;
  password_attempt: string; // ⚠️ mot de passe saisi en clair
  ip_address: string | null;
  user_agent: string | null;
  success: number; // 0 ou 1
  user_id: number | null;
  failure_reason: string | null;
  created_at: Date;
}

/** Réponse API standard */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
