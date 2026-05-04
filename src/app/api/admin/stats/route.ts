import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { ApiError, formatErrorResponse } from "@/lib/errors";

function checkAdminAuth(payload: unknown): asserts payload is { role: "admin" } {
  const p = payload as { role?: string };
  if (p.role !== "admin") {
    throw new ApiError(403, "FORBIDDEN", "Accès réservé aux administrateurs");
  }
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
      throw new ApiError(401, "INVALID_TOKEN", "Token invalide");
    }

    checkAdminAuth(payload);

    const pool = await getPool();
    const [rows] = await pool.execute<Record<string, number>[]>(`
      SELECT
        COUNT(*)                                    AS total,
        SUM(is_active = 1)                          AS active,
        SUM(is_active = 0)                          AS inactive,
        SUM(role = 'admin')                         AS admins,
        SUM(role = 'user')                          AS users,
        SUM(DATE(created_at) = CURDATE())           AS today,
        SUM(created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))  AS last7days,
        SUM(created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS last30days
      FROM users
    `);

    const s = rows[0] || {};

    return NextResponse.json(
      {
        success: true,
        message: "Statistiques récupérées",
        data: {
          stats: {
            total: s.total || 0,
            active: s.active || 0,
            inactive: s.inactive || 0,
            admins: s.admins || 0,
            users: s.users || 0,
            newToday: s.today || 0,
            newLast7Days: s.last7days || 0,
            newLast30Days: s.last30days || 0,
          },
        },
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
