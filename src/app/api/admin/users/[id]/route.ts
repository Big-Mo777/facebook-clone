import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { ApiError, formatErrorResponse } from "@/lib/errors";

interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: "user" | "admin";
  is_active: number;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

function formatUserAdmin(user: UserRow) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: Boolean(user.is_active),
    passwordHash: user.password_hash.substring(0, 20) + "...",
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function checkAdminAuth(payload: unknown): asserts payload is { userId: number; role: "admin" } {
  const p = payload as { role?: string };
  if (p.role !== "admin") {
    throw new ApiError(403, "FORBIDDEN", "Accès réservé aux administrateurs");
  }
}

// GET /api/admin/users/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ApiError(400, "INVALID_ID", "ID invalide");
    }

    const authHeader = req.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      throw new ApiError(401, "MISSING_TOKEN", "Token manquant");
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new ApiError(401, "INVALID_TOKEN", "Token invalide");
    }

    checkAdminAuth(payload);

    const pool = await getPool();
    const [users] = await pool.execute<any[]>(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    if (!(users as UserRow[])[0]) {
      throw new ApiError(404, "USER_NOT_FOUND", "Utilisateur introuvable");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Utilisateur récupéré",
        data: { user: formatUserAdmin((users as UserRow[])[0]) },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: error instanceof ApiError ? error.statusCode : 500,
    });
  }
}

// PATCH /api/admin/users/[id]/status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ApiError(400, "INVALID_ID", "ID invalide");
    }

    const authHeader = req.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      throw new ApiError(401, "MISSING_TOKEN", "Token manquant");
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new ApiError(401, "INVALID_TOKEN", "Token invalide");
    }

    checkAdminAuth(payload);

    if (userId === payload.userId) {
      throw new ApiError(400, "SELF_MODIFY", "Vous ne pouvez pas modifier votre propre statut");
    }

    const body = await req.json();
    const { isActive } = body as { isActive?: unknown };

    if (typeof isActive !== "boolean") {
      throw new ApiError(400, "INVALID_BODY", "isActive doit être un booléen");
    }

    const pool = await getPool();
    const [result] = await pool.execute(
      "UPDATE users SET is_active = ? WHERE id = ?",
      [isActive ? 1 : 0, userId]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new ApiError(404, "USER_NOT_FOUND", "Utilisateur introuvable");
    }

    return NextResponse.json(
      {
        success: true,
        message: `Compte ${isActive ? "activé" : "désactivé"} avec succès`,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: error instanceof ApiError ? error.statusCode : 500,
    });
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ApiError(400, "INVALID_ID", "ID invalide");
    }

    const authHeader = req.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      throw new ApiError(401, "MISSING_TOKEN", "Token manquant");
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new ApiError(401, "INVALID_TOKEN", "Token invalide");
    }

    checkAdminAuth(payload);

    if (userId === payload.userId) {
      throw new ApiError(400, "SELF_MODIFY", "Vous ne pouvez pas supprimer votre propre compte");
    }

    const pool = await getPool();
    const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [userId]);

    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new ApiError(404, "USER_NOT_FOUND", "Utilisateur introuvable");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Utilisateur supprimé définitivement",
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: error instanceof ApiError ? error.statusCode : 500,
    });
  }
}
