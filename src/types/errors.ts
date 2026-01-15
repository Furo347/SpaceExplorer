/**
 * Types d'erreurs API centralisés
 */

export type ApiErrorType = "network" | "api" | "empty" | "unknown";

export interface ApiError {
    type: ApiErrorType;
    message: string;
    statusCode?: number;
    canRetry: boolean;
}

/**
 * Messages d'erreur UX-friendly
 */
export const ERROR_MESSAGES: Record<ApiErrorType, string> = {
    network: "Connexion impossible. Vérifiez votre connexion internet.",
    api: "Service temporairement indisponible. Veuillez réessayer plus tard.",
    empty: "Aucune donnée disponible pour cette sélection.",
    unknown: "Une erreur inattendue s'est produite.",
};

/**
 * Messages d'erreur contextuels
 */
export const CONTEXTUAL_EMPTY_MESSAGES = {
    apod: "Aucune image astronomique disponible pour cette date.",
    mars: "Aucune photo trouvée pour ce rover à cette date.",
    epic: "Aucune image de la Terre disponible pour cette date. Essayez une date antérieure.",
};

/**
 * Crée une erreur API structurée à partir d'une exception
 */
export function createApiError(error: unknown, context?: keyof typeof CONTEXTUAL_EMPTY_MESSAGES): ApiError {
    // Erreur réseau (fetch échoué, pas de connexion)
    if (error instanceof TypeError && error.message.includes("Network")) {
        return {
            type: "network",
            message: ERROR_MESSAGES.network,
            canRetry: true,
        };
    }

    // Erreur réseau générique (fetch failed)
    if (error instanceof TypeError || (error instanceof Error && error.message.toLowerCase().includes("fetch"))) {
        return {
            type: "network",
            message: ERROR_MESSAGES.network,
            canRetry: true,
        };
    }

    // Erreur API avec status code
    if (error instanceof ApiHttpError) {
        const statusCode = error.statusCode;

        // Erreurs 4xx côté client
        if (statusCode >= 400 && statusCode < 500) {
            if (statusCode === 404) {
                return {
                    type: "empty",
                    message: context ? CONTEXTUAL_EMPTY_MESSAGES[context] : ERROR_MESSAGES.empty,
                    statusCode,
                    canRetry: false,
                };
            }
            if (statusCode === 429) {
                return {
                    type: "api",
                    message: "Trop de requêtes. Veuillez patienter quelques instants.",
                    statusCode,
                    canRetry: true,
                };
            }
            return {
                type: "api",
                message: ERROR_MESSAGES.api,
                statusCode,
                canRetry: true,
            };
        }

        // Erreurs 5xx côté serveur
        if (statusCode >= 500) {
            return {
                type: "api",
                message: ERROR_MESSAGES.api,
                statusCode,
                canRetry: true,
            };
        }
    }

    // Erreur générique avec message
    if (error instanceof Error) {
        // Check if it's an API error message
        if (error.message.includes("API error")) {
            return {
                type: "api",
                message: ERROR_MESSAGES.api,
                canRetry: true,
            };
        }
    }

    // Erreur inconnue
    return {
        type: "unknown",
        message: ERROR_MESSAGES.unknown,
        canRetry: true,
    };
}

/**
 * Classe d'erreur HTTP personnalisée pour les erreurs API
 */
export class ApiHttpError extends Error {
    constructor(
        public statusCode: number,
        message?: string
    ) {
        super(message || `HTTP Error ${statusCode}`);
        this.name = "ApiHttpError";
    }
}

/**
 * Crée une erreur pour données vides
 */
export function createEmptyDataError(context?: keyof typeof CONTEXTUAL_EMPTY_MESSAGES): ApiError {
    return {
        type: "empty",
        message: context ? CONTEXTUAL_EMPTY_MESSAGES[context] : ERROR_MESSAGES.empty,
        canRetry: false,
    };
}

