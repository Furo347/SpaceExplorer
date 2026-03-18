import { NASA_API_KEY } from "../config";
import { ApiHttpError } from "../types/errors";

/* ============================
   Types
============================ */

export type APODResponse = {
    title: string;
    explanation: string;
    url: string;
    hdurl?: string;
    date: string;
    media_type: "image" | "video";
};

export type MarsPhoto = {
    id: number;
    img_src: string;
    earth_date: string;
    rover: {
        name: string;
        landing_date: string;
        launch_date: string;
        status: string;
    };
    camera: {
        name: string;
        full_name: string;
    };
};

export type MarsResponse = {
    photos: MarsPhoto[];
};

export type ImageSearchItem = {
    title: string;
    description: string;
    imageUrl: string;
};

export type ImageSearchResponse = ImageSearchItem[];

export type EPICImage = {
    identifier: string;
    caption: string;
    image: string;
    date: string;
    centroid_coordinates: {
        lat: number;
        lon: number;
    };
};

export type NeoWsLinkCollection = {
    next?: string;
    prev?: string;
    self?: string;
};

export type NeoWsEstimatedDiameter = {
    estimated_diameter_min: number;
    estimated_diameter_max: number;
};

export type NeoWsAsteroid = {
    id: string;
    neo_reference_id: string;
    name: string;
    nasa_jpl_url: string;
    absolute_magnitude_h: number;
    estimated_diameter: {
        kilometers: NeoWsEstimatedDiameter;
        meters: NeoWsEstimatedDiameter;
        miles: NeoWsEstimatedDiameter;
        feet: NeoWsEstimatedDiameter;
    };
    is_potentially_hazardous_asteroid: boolean;
    is_sentry_object: boolean;
    close_approach_data: Array<{
        close_approach_date: string;
        close_approach_date_full?: string;
        epoch_date_close_approach?: number;
        orbiting_body: string;
        relative_velocity: {
            kilometers_per_second: string;
            kilometers_per_hour: string;
            miles_per_hour: string;
        };
        miss_distance: {
            astronomical: string;
            lunar: string;
            kilometers: string;
            miles: string;
        };
    }>;
};

export type NeoWsFeedResponse = {
    links: NeoWsLinkCollection;
    element_count: number;
    near_earth_objects: Record<string, NeoWsAsteroid[]>;
};

export type DonkiEventType = "FLR" | "SEP" | "CME" | "IPS" | "MPC" | "GST" | "RBE";

export type DonkiUiEvent = {
    id: string;
    type: DonkiEventType;
    title: string;
    date: string;
    source?: string;
    summary: string;
    link?: string;
};

type DonkiFlrEvent = {
    flrID: string;
    beginTime: string;
    peakTime?: string;
    endTime?: string;
    classType?: string;
    sourceLocation?: string;
    link?: string;
};

type DonkiSepEvent = {
    sepID: string;
    eventTime: string;
    instruments?: Array<{ displayName?: string }>;
    link?: string;
};

type DonkiCmeEvent = {
    activityID: string;
    startTime: string;
    cmeAnalyses?: Array<{
        speed?: number;
        type?: string;
        latitude?: number;
        longitude?: number;
    }>;
    note?: string;
    link?: string;
};

type DonkiGstEvent = {
    gstID: string;
    startTime: string;
    allKpIndex?: Array<{
        kpIndex?: number;
        observedTime?: string;
    }>;
    link?: string;
};

type DonkiGenericEvent = Record<string, unknown>;

/* ============================
   API Core
============================ */

const NASA_BASE_URL = "https://api.nasa.gov";

const API_TIMEOUT = 15000;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const NEO_WS_MAX_RANGE_DAYS = 7;

const DONKI_SUPPORTED_TYPES: DonkiEventType[] = ["FLR", "SEP", "CME", "IPS", "MPC", "GST", "RBE"];

const DONKI_TYPE_TITLES: Record<DonkiEventType, string> = {
    FLR: "Solar Flare",
    SEP: "Solar Energetic Particles",
    CME: "Coronal Mass Ejection",
    IPS: "Interplanetary Shock",
    MPC: "Magnetopause Crossing",
    GST: "Geomagnetic Storm",
    RBE: "Radiation Belt Enhancement",
};

const DEBUG_MODE = __DEV__ ?? true;

function debugLog(message: string, data?: any) {
    if (DEBUG_MODE) {
        console.log(`[NASA API] ${message}`, data ?? "");
    }
}

function assertIsoDate(date: string, fieldName: string): void {
    if (!ISO_DATE_REGEX.test(date)) {
        debugLog(`Invalid ${fieldName} format: ${date}`);
        throw new ApiHttpError(400, `Format de date invalide pour ${fieldName}: ${date}. Format attendu: YYYY-MM-DD`);
    }
}

function parseIsoDate(date: string, fieldName: string): Date {
    assertIsoDate(date, fieldName);

    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
        throw new ApiHttpError(400, `Date invalide pour ${fieldName}: ${date}`);
    }

    return parsed;
}

function diffDays(startDate: string, endDate: string): number {
    const start = parseIsoDate(startDate, "startDate");
    const end = parseIsoDate(endDate, "endDate");
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay);
}

function normalizeApiError(error: unknown, fallbackMessage: string): ApiHttpError {
    if (error instanceof ApiHttpError) {
        return error;
    }

    if (error instanceof Error) {
        return new ApiHttpError(503, `${fallbackMessage} (${error.message})`);
    }

    return new ApiHttpError(503, fallbackMessage);
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
    return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) : [];
}

function stripMarkdownNoise(text: string): string {
    const withoutLinks = text.replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1");

    return withoutLinks
        .replace(/\r/g, "")
        .split("\n")
        .map((line) => line
            .replace(/^\s{0,3}(?:#{1,6}\s*|[-*+]\s+|>\s+|\d+[.)]\s+)/, "")
            .replace(/\s*#{1,6}\s*/g, " ")
            .trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

function truncateSentence(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return `${(lastSpace > Math.floor(maxLength * 0.6) ? truncated.slice(0, lastSpace) : truncated).trim()}...`;
}

function getRawDate(raw: Record<string, unknown>): string | undefined {
    return asString(raw.beginTime)
        ?? asString(raw.startTime)
        ?? asString(raw.eventTime)
        ?? asString(raw.submissionTime)
        ?? asString(raw.messageIssueTime)
        ?? asString(raw.peakTime);
}

function getRawLink(raw: Record<string, unknown>): string | undefined {
    return asString(raw.link) ?? asString(raw.messageURL);
}

function getRawId(type: DonkiEventType, raw: Record<string, unknown>, fallbackIndex: number, date: string): string {
    return asString(raw.flrID)
        ?? asString(raw.sepID)
        ?? asString(raw.activityID)
        ?? asString(raw.gstID)
        ?? asString(raw.rbeID)
        ?? asString(raw.mpcID)
        ?? asString(raw.ipsID)
        ?? asString(raw.messageID)
        ?? `${type}-${date}-${fallbackIndex}`;
}

function buildFlrSummary(raw: DonkiFlrEvent): string {
    const classType = asString(raw.classType);
    const sourceLocation = asString(raw.sourceLocation);
    const peakTime = asString(raw.peakTime);

    const details: string[] = [];
    if (classType) details.push(`classe ${classType}`);
    if (sourceLocation) details.push(`source ${sourceLocation}`);
    if (peakTime) details.push(`pic vers ${peakTime}`);

    if (details.length === 0) {
        return "Une eruption solaire a ete detectee sur la periode selectionnee.";
    }

    return `Une eruption solaire est signalee (${details.join(", ")}).`;
}

function buildSepSummary(raw: DonkiSepEvent): string {
    const instruments = (raw.instruments ?? [])
        .map((instrument) => asString(instrument.displayName))
        .filter((name): name is string => Boolean(name));

    if (instruments.length === 0) {
        return "Des particules energetiques solaires ont ete detectees.";
    }

    return `Des particules energetiques solaires ont ete detectees par ${instruments.slice(0, 2).join(" / ")}.`;
}

function buildCmeSummary(raw: DonkiCmeEvent): string {
    const analyses = raw.cmeAnalyses ?? [];
    const firstAnalysis = analyses[0];
    const speed = asNumber(firstAnalysis?.speed);
    const analysisType = asString(firstAnalysis?.type);
    const note = asString(raw.note);

    const details: string[] = [];
    if (analysisType) details.push(`type ${analysisType}`);
    if (typeof speed === "number") details.push(`vitesse estimee ${Math.round(speed)} km/s`);

    if (details.length > 0) {
        return `Une ejection de masse coronale est suivie (${details.join(", ")}).`;
    }

    if (note) {
        return truncateSentence(stripMarkdownNoise(note), 190);
    }

    return "Une ejection de masse coronale est en cours de suivi par la NASA.";
}

function buildGstSummary(raw: DonkiGstEvent): string {
    const kpValues = (raw.allKpIndex ?? [])
        .map((item) => asNumber(item.kpIndex))
        .filter((value): value is number => typeof value === "number");

    if (kpValues.length === 0) {
        return "Une activite geomagnetique a ete signalee sur la periode selectionnee.";
    }

    const maxKp = Math.max(...kpValues);
    return `Tempete geomagnetique detectee, avec un indice Kp maximal de ${maxKp.toFixed(1)}.`;
}

function buildGenericSummary(type: DonkiEventType, raw: Record<string, unknown>): string {
    const messageBody = asString(raw.messageBody);
    if (messageBody) {
        const cleaned = stripMarkdownNoise(messageBody);
        if (cleaned) return truncateSentence(cleaned, 190);
    }

    switch (type) {
        case "IPS":
            return "Une onde de choc interplanetaire est rapportee sur cette periode.";
        case "MPC":
            return "Une variation de la magnetopause terrestre est observee.";
        case "RBE":
            return "Une evolution de la ceinture de radiation a ete detectee.";
        default:
            return "Evenement de meteo spatiale detecte par la NASA.";
    }
}

function mapDonkiRawEvent(type: DonkiEventType, raw: Record<string, unknown>, index: number): DonkiUiEvent | null {
    const date = getRawDate(raw);
    if (!date) {
        debugLog(`DONKI ${type}: skipped event without date`, raw);
        return null;
    }

    let summary: string;
    if (type === "FLR") {
        summary = buildFlrSummary(raw as DonkiFlrEvent);
    } else if (type === "SEP") {
        summary = buildSepSummary(raw as DonkiSepEvent);
    } else if (type === "CME") {
        summary = buildCmeSummary(raw as DonkiCmeEvent);
    } else if (type === "GST") {
        summary = buildGstSummary(raw as DonkiGstEvent);
    } else {
        summary = buildGenericSummary(type, raw);
    }

    const source = asString(raw.sourceLocation)
        ?? asString(raw.catalog)
        ?? asString(raw.classType)
        ?? undefined;

    return {
        id: getRawId(type, raw, index, date),
        type,
        title: DONKI_TYPE_TITLES[type],
        date,
        source,
        summary: truncateSentence(summary, 220),
        link: getRawLink(raw),
    };
}

function sortDonkiEventsByDate(events: DonkiUiEvent[]): DonkiUiEvent[] {
    return [...events].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
            return b.date.localeCompare(a.date);
        }
        return timeB - timeA;
    });
}

async function fetchWithTimeout(url: string, timeout: number = API_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    debugLog("Fetching URL:", url.replace(NASA_API_KEY, "***API_KEY***"));

    try {
        const response = await fetch(url, { signal: controller.signal });
        debugLog(`Response status: ${response.status} ${response.statusText}`);
        return response;
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            debugLog("Request timeout");
            throw new ApiHttpError(408, "La requête a pris trop de temps. Veuillez réessayer.");
        }
        debugLog("Fetch error:", error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        debugLog(`API Error (${response.status}):`, errorText);
        throw new ApiHttpError(response.status, `NASA API error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    debugLog("Response data received:", Array.isArray(data) ? `Array[${data.length}]` : typeof data);
    return data as T;
}

async function apiGet<T>(
    endpoint: string,
    params: Record<string, string | undefined> = {}
): Promise<T> {
    const query = new URLSearchParams({
        api_key: NASA_API_KEY,
        ...Object.fromEntries(
            Object.entries(params).filter(([, value]) => value !== undefined)
        ),
    });

    const url = `${NASA_BASE_URL}${endpoint}?${query.toString()}`;
    const response = await fetchWithTimeout(url);
    return handleResponse<T>(response);
}

/* ============================
   Endpoints
============================ */

export function getAPOD(date?: string): Promise<APODResponse> {
    return apiGet<APODResponse>("/planetary/apod", {
        date,
    });
}

export async function getNearEarthObjects(date: string): Promise<NeoWsAsteroid[]> {
    assertIsoDate(date, "date");

    debugLog(`Fetching NeoWs feed for date: ${date}`);

    try {
        const data = await apiGet<NeoWsFeedResponse>("/neo/rest/v1/feed", {
            start_date: date,
            end_date: date,
        });

        const asteroids = data.near_earth_objects?.[date] ?? [];
        debugLog(`NeoWs asteroids received for ${date}: ${asteroids.length}`);

        return asteroids;
    } catch (error) {
        debugLog("NeoWs API error:", error);
        throw normalizeApiError(error, "Service NeoWs temporairement indisponible");
    }
}

export async function getDonkiEvents(startDate: string, endDate: string): Promise<DonkiUiEvent[]> {
    assertIsoDate(startDate, "startDate");
    assertIsoDate(endDate, "endDate");

    const rangeDays = diffDays(startDate, endDate);

    if (rangeDays < 0) {
        throw new ApiHttpError(400, "La date de fin doit être supérieure ou égale à la date de début.");
    }

    if (rangeDays > NEO_WS_MAX_RANGE_DAYS) {
        throw new ApiHttpError(400, "La plage de dates est trop grande. Limite: 7 jours.");
    }

    debugLog(`Fetching DONKI events from ${startDate} to ${endDate}`);

    try {
        const results = await Promise.allSettled(
            DONKI_SUPPORTED_TYPES.map(async (type) => {
                const data = await apiGet<DonkiGenericEvent[]>(`/DONKI/${type}`, {
                    startDate,
                    endDate,
                });

                const rawEvents = asRecordArray(data);
                const mappedEvents = rawEvents
                    .map((event, index) => mapDonkiRawEvent(type, event, index))
                    .filter((event): event is DonkiUiEvent => event !== null);

                debugLog(`DONKI ${type}: ${mappedEvents.length} event(s) mapped`);
                return mappedEvents;
            })
        );

        const fulfilled = results.filter((result): result is PromiseFulfilledResult<DonkiUiEvent[]> => result.status === "fulfilled");
        const rejected = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");

        if (fulfilled.length === 0 && rejected.length > 0) {
            throw rejected[0].reason;
        }

        const merged = fulfilled.flatMap((result) => result.value);
        debugLog(`DONKI total events mapped: ${merged.length}`);

        return sortDonkiEventsByDate(merged);
    } catch (error) {
        debugLog("DONKI API error:", error);
        throw normalizeApiError(error, "Service DONKI temporairement indisponible");
    }
}

export async function getMarsPhotos(
    rover: string,
    date: string
): Promise<MarsPhoto[]> {
    // Valider le nom du rover
    const validRovers = ["curiosity", "opportunity", "spirit"];
    const normalizedRover = rover.toLowerCase();

    if (!validRovers.includes(normalizedRover)) {
        debugLog(`Invalid rover name: ${rover}`);
        throw new ApiHttpError(400, `Rover invalide: ${rover}. Rovers valides: ${validRovers.join(", ")}`);
    }

    assertIsoDate(date, "date");

    debugLog(`Fetching Mars photos for rover: ${normalizedRover}, date: ${date}`);

    const query = new URLSearchParams({
        earth_date: date,
        api_key: NASA_API_KEY,
    });
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${normalizedRover}/photos?${query.toString()}`;

    try {
        const response = await fetchWithTimeout(url);
        const result = await handleResponse<MarsResponse>(response);

        debugLog(`Mars photos received: ${result.photos?.length ?? 0} photos`);

        if (!result.photos) {
            debugLog("No photos array in response");
            return [];
        }

        return result.photos;
    } catch (error) {
        debugLog("Mars API error:", error);
        throw error;
    }
}

export async function searchImages(
    query: string
): Promise<ImageSearchResponse> {
    const data = await apiGet<any>("/search", { q: query });

    const collection = data.collection?.items ?? [];

    return collection
        .map((item: any) => {
            const info = item.data?.[0];
            const img = item.links?.find((l: any) => l.render === "image");

            if (!info || !img) return null;

            return {
                title: info.title,
                description: info.description || "",
                imageUrl: img.href,
            };
        })
        .filter(Boolean) as ImageSearchItem[];
}

export async function getEPICImages(date: string): Promise<EPICImage[]> {
    assertIsoDate(date, "date");

    debugLog(`Fetching EPIC images for date: ${date}`);

    const url = `https://api.nasa.gov/EPIC/api/natural/date/${date}?api_key=${NASA_API_KEY}`;

    try {
        const response = await fetchWithTimeout(url);
        const data = await handleResponse<EPICImage[]>(response);

        debugLog(`EPIC images received: ${data?.length ?? 0} images`);

        if (!Array.isArray(data)) {
            debugLog("EPIC response is not an array:", typeof data);
            return [];
        }

        return data;
    } catch (error) {
        debugLog("EPIC API error:", error);
        throw error;
    }
}

export async function getEPICAvailableDates(): Promise<string[]> {
    debugLog("Fetching EPIC available dates");

    const url = `https://api.nasa.gov/EPIC/api/natural/all?api_key=${NASA_API_KEY}`;

    try {
        const response = await fetchWithTimeout(url);
        const data = await handleResponse<Array<{ date: string }>>(response);

        const dates = data.map(item => item.date.split(" ")[0]);
        debugLog(`EPIC available dates: ${dates.length} dates, latest: ${dates[0]}`);

        return dates;
    } catch (error) {
        debugLog("EPIC available dates error:", error);
        throw error;
    }
}

export function getEPICImageUrl(date: string, imageName: string): string {
    const [year, month, day] = date.split("-");
    return `https://api.nasa.gov/EPIC/archive/natural/${year}/${month}/${day}/png/${imageName}.png?api_key=${NASA_API_KEY}`;
}
