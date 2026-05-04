import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { ApiError, formatErrorResponse } from "@/lib/errors";

function checkAdminAuth(payload: unknown): asserts payload is { userId: number; role: "admin" } {
  const p = payload as { role?: string };
  if (p.role !== "admin") {
    throw new ApiError(403, "FORBIDDEN", "Accès réservé aux administrateurs");
  }
}

// PATCH /api/admin/users/[id]/role
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
      throw new ApiError(400, "SELF_MODIFY", "Vous ne pouvez pas modifier votre propre rôle");
    }

    const body = await req.json();
    const { role } = body as { role?: unknown };

    if (role !== "user" && role !== "admin") {
      throw new ApiError(400, "INVALID_ROLE", "Rôle invalide. Valeurs acceptées : user, admin");
    }

    const pool = await getPool();
    const [result] = await pool.execute("UPDATE users SET role = ? WHERE id = ?", [role, userId]);

    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new ApiError(404, "USER_NOT_FOUND", "Utilisateur introuvable");
    }

    return NextResponse.json(
      {
        success: true,
        message: `Rôle mis à jour : ${role}`,
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
