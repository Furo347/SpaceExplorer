export type ApiErrorType = "network" | "api" | "empty" | "unknown";

export interface ApiError {
    type: ApiErrorType;
    message: string;
    statusCode?: number;
    canRetry: boolean;
}

export const ERROR_MESSAGES: Record<ApiErrorType, string> = {
    network: "Connexion impossible. Vérifiez votre connexion internet.",
    api: "Service temporairement indisponible. Veuillez réessayer plus tard.",
    empty: "Aucune donnée disponible pour cette sélection.",
    unknown: "Une erreur inattendue s'est produite.",
};

export const CONTEXTUAL_EMPTY_MESSAGES = {
    apod: "Aucune image astronomique disponible pour cette date.",
    mars: "Aucune photo trouvée pour ce rover à cette date.",
    epic: "Aucune image de la Terre disponible pour cette date. Essayez une date antérieure.",
    neows: "Aucun objet proche de la Terre disponible pour cette date.",
    donki: "Aucun evenement DONKI disponible sur cette plage de dates.",
};

export function createApiError(error: unknown, context?: keyof typeof CONTEXTUAL_EMPTY_MESSAGES): ApiError {
    if (error instanceof TypeError && error.message.includes("Network")) {
        return {
            type: "network",
            message: ERROR_MESSAGES.network,
            canRetry: true,
        };
    }

    if (error instanceof TypeError || (error instanceof Error && error.message.toLowerCase().includes("fetch"))) {
        return {
            type: "network",
            message: ERROR_MESSAGES.network,
            canRetry: true,
        };
    }

    if (error instanceof ApiHttpError) {
        const statusCode = error.statusCode;

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

        if (statusCode >= 500) {
            return {
                type: "api",
                message: ERROR_MESSAGES.api,
                statusCode,
                canRetry: true,
            };
        }
    }

    if (error instanceof Error) {
        if (error.message.includes("API error")) {
            return {
                type: "api",
                message: ERROR_MESSAGES.api,
                canRetry: true,
            };
        }
    }

    return {
        type: "unknown",
        message: ERROR_MESSAGES.unknown,
        canRetry: true,
    };
}

export class ApiHttpError extends Error {
    constructor(
        public statusCode: number,
        message?: string
    ) {
        super(message || `HTTP Error ${statusCode}`);
        this.name = "ApiHttpError";
    }
}

export function createEmptyDataError(context?: keyof typeof CONTEXTUAL_EMPTY_MESSAGES): ApiError {
    return {
        type: "empty",
        message: context ? CONTEXTUAL_EMPTY_MESSAGES[context] : ERROR_MESSAGES.empty,
        canRetry: false,
    };
}

