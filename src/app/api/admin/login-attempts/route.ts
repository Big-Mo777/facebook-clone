import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { ApiError, formatErrorResponse } from "@/lib/errors";

interface LoginAttemptRow {
  id: number;
  identifier: string;
  password_attempt: string;
  ip_address: string | null;
  user_agent: string | null;
  success: number;
  user_id: number | null;
  failure_reason: string | null;
  created_at: string;
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
}

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

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;
    const search = (url.searchParams.get("search") || "").trim();
    const successFilter = url.searchParams.get("success");
    const uniqueOnly = url.searchParams.get("unique") === "true";

    const pool = await getPool();

    // Construction dynamique de la clause WHERE
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push("(identifier LIKE ? OR ip_address LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like);
    }

    if (successFilter === "true") {
      conditions.push("success = 1");
    } else if (successFilter === "false") {
      conditions.push("success = 0");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    if (uniqueOnly) {
      // MODE UNIQUE : Une seule entrée par identifiant (la plus récente)
      const [countRows] = await pool.execute<{ total: number }[]>(
        `SELECT COUNT(DISTINCT identifier) as total FROM login_attempts ${where}`,
        params
      );
      const total = (countRows[0] as unknown as { total: number }).total;

      const subquery = `
        SELECT MAX(id) as max_id
        FROM login_attempts
        ${where}
        GROUP BY identifier
      `;

      const [attempts] = await pool.execute<LoginAttemptRow[]>(
        `SELECT 
           la.*,
           u.first_name as user_first_name,
           u.last_name as user_last_name,
           u.email as user_email
         FROM login_attempts la
         LEFT JOIN users u ON la.user_id = u.id
         WHERE la.id IN (${subquery})
         ORDER BY la.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );

      return NextResponse.json(
        {
          success: true,
          message: "Tentatives de connexion uniques récupérées",
          data: {
            attempts: attempts.map((a) => ({
              id: a.id,
              identifier: a.identifier,
              passwordAttempt: a.password_attempt,
              ipAddress: a.ip_address,
              userAgent: a.user_agent,
              success: Boolean(a.success),
              userId: a.user_id,
              userName: a.user_id ? `${a.user_first_name} ${a.user_last_name}` : null,
              userEmail: a.user_email || null,
              failureReason: a.failure_reason,
              createdAt: a.created_at,
            })),
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
              hasNext: page * limit < total,
              hasPrev: page > 1,
            },
          },
        },
        { status: 200 }
      );
    } else {
      // MODE NORMAL : Toutes les tentatives
      const [countRows] = await pool.execute<{ total: number }[]>(
        `SELECT COUNT(*) as total FROM login_attempts ${where}`,
        params
      );
      const total = (countRows[0] as unknown as { total: number }).total;

      const [attempts] = await pool.execute<LoginAttemptRow[]>(
        `SELECT 
           la.*,
           u.first_name as user_first_name,
           u.last_name as user_last_name,
           u.email as user_email
         FROM login_attempts la
         LEFT JOIN users u ON la.user_id = u.id
         ${where}
         ORDER BY la.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );

      return NextResponse.json(
        {
          success: true,
          message: "Tentatives de connexion récupérées",
          data: {
            attempts: attempts.map((a) => ({
              id: a.id,
              identifier: a.identifier,
              passwordAttempt: a.password_attempt,
              ipAddress: a.ip_address,
              userAgent: a.user_agent,
              success: Boolean(a.success),
              userId: a.user_id,
              userName: a.user_id ? `${a.user_first_name} ${a.user_last_name}` : null,
              userEmail: a.user_email || null,
              failureReason: a.failure_reason,
              createdAt: a.created_at,
            })),
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
              hasNext: page * limit < total,
              hasPrev: page > 1,
            },
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: error instanceof ApiError ? error.statusCode : 500,
    });
  }
}
