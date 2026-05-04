import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { signToken, hashPassword } from "@/lib/auth";
import { validateRegisterInput } from "@/lib/validation";
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, password } = validateRegisterInput(body);

    const pool = await getPool();

    // Vérifier si email existe
    if (email) {
      const [rows] = await pool.execute<UserRow[]>(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
      if (rows.length > 0) {
        throw new ApiError(409, "EMAIL_TAKEN", "Cet email est déjà utilisé");
      }
    }

    // Vérifier si phone existe
    if (phone) {
      const [rows] = await pool.execute<UserRow[]>(
        "SELECT id FROM users WHERE phone = ?",
        [phone]
      );
      if (rows.length > 0) {
        throw new ApiError(409, "PHONE_TAKEN", "Ce téléphone est déjà utilisé");
      }
    }

    // Hash du mot de passe
    const passwordHash = await hashPassword(password);

    // Insérer l'utilisateur
    const [result] = await pool.execute(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email || null, phone || null, passwordHash]
    );

    const insertId = (result as { insertId: number }).insertId;

    // Récupérer l'utilisateur créé
    const [users] = await pool.execute<UserRow[]>(
      "SELECT * FROM users WHERE id = ?",
      [insertId]
    );

    const newUser = users[0];
    const token = signToken({
      userId: newUser.id,
      email: newUser.email || "",
      role: newUser.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Compte créé avec succès",
        data: {
          token,
          user: formatUser(newUser),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: (error instanceof ApiError ? error.statusCode : 500),
    });
  }
}
