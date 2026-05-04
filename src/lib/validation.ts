import { ApiError } from "./errors";

/**
 * Valide une adresse email
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valide un numéro de téléphone (format simple)
 */
export function validatePhone(phone: string): boolean {
  const regex = /^[\d\s\-\+\(\)]{7,}$/;
  return regex.test(phone);
}

/**
 * Valide un mot de passe (min 8 caractères)
 */
export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Valide les données d'inscription
 */
export function validateRegisterInput(data: unknown): {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
} {
  const obj = data as Record<string, unknown>;

  const firstName = String(obj.firstName || "").trim();
  const lastName = String(obj.lastName || "").trim();
  const email = obj.email ? String(obj.email).trim().toLowerCase() : undefined;
  const phone = obj.phone ? String(obj.phone).trim() : undefined;
  const password = String(obj.password || "").trim();

  if (!firstName || firstName.length < 2) {
    throw new ApiError(400, "INVALID_FIRST_NAME", "Le prénom doit contenir au moins 2 caractères");
  }

  if (!lastName || lastName.length < 2) {
    throw new ApiError(400, "INVALID_LAST_NAME", "Le nom doit contenir au moins 2 caractères");
  }

  if (!email && !phone) {
    throw new ApiError(
      400,
      "MISSING_IDENTIFIER",
      "Un email ou un téléphone est requis"
    );
  }

  if (email && !validateEmail(email)) {
    throw new ApiError(400, "INVALID_EMAIL", "Email invalide");
  }

  if (phone && !validatePhone(phone)) {
    throw new ApiError(400, "INVALID_PHONE", "Téléphone invalide");
  }

  if (!validatePassword(password)) {
    throw new ApiError(
      400,
      "WEAK_PASSWORD",
      "Le mot de passe doit contenir au moins 8 caractères"
    );
  }

  return { firstName, lastName, email, phone, password };
}

/**
 * Valide les données de connexion
 */
export function validateLoginInput(data: unknown): {
  identifier: string;
  password: string;
} {
  const obj = data as Record<string, unknown>;

  const identifier = String(obj.identifier || "").trim();
  const password = String(obj.password || "").trim();

  if (!identifier) {
    throw new ApiError(400, "MISSING_IDENTIFIER", "Email ou téléphone requis");
  }

  if (!password) {
    throw new ApiError(400, "MISSING_PASSWORD", "Mot de passe requis");
  }

  return { identifier, password };
}
