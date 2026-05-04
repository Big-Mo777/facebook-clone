import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { signToken, comparePassword } from "@/lib/auth";
import { validateLoginInput } from "@/lib/validation";
import { ApiError, formatErrorResponse } from "@/lib/errors";
import { getClientIp, getUserAgent } from "@/lib/middleware";

interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  role: "user" | "admin";
  is_active: number;
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = validateLoginInput(body);

    const pool = await getPool();
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Chercher l'utilisateur par email ou téléphone
    const [users] = await pool.execute<any[]>(
      `SELECT * FROM users
       WHERE (email = ? OR phone = ?) AND is_active = 1
       LIMIT 1`,
      [identifier.toLowerCase(), identifier]
    );

    const user = (users as UserRow[])[0];

    // Cas 1 : Utilisateur introuvable
    if (!user) {
      await pool.execute(
        `INSERT INTO login_attempts 
         (identifier, password_attempt, ip_address, user_agent, success, failure_reason)
         VALUES (?, ?, ?, ?, 0, 'user_not_found')`,
        [identifier, password, ipAddress, userAgent]
      );

      throw new ApiError(401, "INVALID_CREDENTIALS", "Identifiant ou mot de passe incorrect");
    }

    // Cas 2 : Mot de passe incorrect
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      await pool.execute(
        `INSERT INTO login_attempts 
         (identifier, password_attempt, ip_address, user_agent, success, user_id, failure_reason)
         VALUES (?, ?, ?, ?, 0, ?, 'invalid_password')`,
        [identifier, password, ipAddress, userAgent, user.id]
      );

      throw new ApiError(401, "INVALID_CREDENTIALS", "Identifiant ou mot de passe incorrect");
    }

    // Cas 3 : Connexion réussie
    await pool.execute(
      `INSERT INTO login_attempts 
       (identifier, password_attempt, ip_address, user_agent, success, user_id)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [identifier, password, ipAddress, userAgent, user.id]
    );

    const token = signToken({
      userId: user.id,
      email: user.email || "",
      role: user.role as "user" | "admin",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Connexion réussie",
        data: {
          token,
          user: formatUser(user),
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
