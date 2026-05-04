/**
 * Classe d'erreur personnalisée pour l'API
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Formate une erreur pour la réponse API
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return {
      success: false,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      message: error.message,
      code: "INTERNAL_ERROR",
      statusCode: 500,
    };
  }

  return {
    success: false,
    message: "Erreur interne du serveur",
    code: "INTERNAL_ERROR",
    statusCode: 500,
  };
}
