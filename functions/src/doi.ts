import * as functions from "firebase-functions";
import axios from "axios";

interface DoiMetadata {
  title: string;
  authors: string[];
  year: number | null;
  venue: string;
  abstract: string;
  doi: string;
  issn?: string;
}

export const fetchDoiMetadata = functions.https.onCall(
  async (data: { doi: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }

    const { doi } = data;
    if (!doi) {
      throw new functions.https.HttpsError("invalid-argument", "DOI is required.");
    }

    try {
      const response = await axios.get(
        `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
        {
          headers: { "User-Agent": "IMS-Portal/1.0 (mailto:admin@institution.edu)" },
          timeout: 8000,
        }
      );

      const work = response.data.message;

      const metadata: DoiMetadata = {
        title: work.title?.[0] ?? "",
        authors:
          work.author?.map(
            (a: { given?: string; family?: string }) =>
              `${a.given ?? ""} ${a.family ?? ""}`.trim()
          ) ?? [],
        year: work.published?.["date-parts"]?.[0]?.[0] ?? null,
        venue: work["container-title"]?.[0] ?? work["short-container-title"]?.[0] ?? "",
        abstract: work.abstract?.replace(/<[^>]*>/g, "") ?? "",
        doi: work.DOI,
        issn: work.ISSN?.[0],
      };

      return metadata;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number }; code?: string };
      if (axiosError.response?.status === 404 || axiosError.code === "ENOTFOUND") {
        throw new functions.https.HttpsError("not-found", "DOI not found in CrossRef.");
      }
      functions.logger.error("DOI fetch error", error);
      throw new functions.https.HttpsError("internal", "Failed to fetch DOI metadata.");
    }
  }
);
