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
  created_at: string;
}

function formatUser(user: UserRow) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.created_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      throw new ApiError(401, "MISSING_TOKEN", "Token manquant");
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new ApiError(401, "INVALID_TOKEN", "Token invalide ou expiré");
    }

    const pool = await getPool();
    const [users] = await pool.execute<any[]>(
      "SELECT * FROM users WHERE id = ? AND is_active = 1",
      [payload.userId]
    );

    if (!(users as UserRow[])[0]) {
      throw new ApiError(404, "USER_NOT_FOUND", "Utilisateur introuvable");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profil récupéré",
        data: { user: formatUser((users as UserRow[])[0]) },
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
