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

export async function GET(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      throw new ApiError(401, "MISSING_TOKEN", "Token manquant");
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      throw new ApiError(403, "FORBIDDEN", "Accès réservé aux administrateurs");
    }

    // Récupérer les paramètres de pagination et filtrage
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    const search = (url.searchParams.get("search") || "").trim();
    const role = url.searchParams.get("role");
    const isActive = url.searchParams.get("isActive");
    const sortBy = ["id", "first_name", "last_name", "email", "created_at"].includes(
      url.searchParams.get("sortBy") || ""
    )
      ? url.searchParams.get("sortBy")
      : "created_at";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "ASC" : "DESC";

    const pool = await getPool();

    // Construction dynamique de la clause WHERE
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push(
        "(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)"
      );
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (role === "admin" || role === "user") {
      conditions.push("role = ?");
      params.push(role);
    }

    if (isActive === "true") {
      conditions.push("is_active = 1");
    } else if (isActive === "false") {
      conditions.push("is_active = 0");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Comptage total
    const [countRows] = await pool.execute<any[]>(
      `SELECT COUNT(*) as total FROM users ${where}`,
      params
    );
    const total = (countRows[0] as { total: number }).total;

    // Requête paginée
    const [users] = await pool.execute<any[]>(
      `SELECT * FROM users ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return NextResponse.json(
      {
        success: true,
        message: "Utilisateurs récupérés",
        data: {
          users: (users as UserRow[]).map(formatUserAdmin),
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
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: error instanceof ApiError ? error.statusCode : 500,
    });
  }
}
