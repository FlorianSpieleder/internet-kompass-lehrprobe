import {
  getAnswerStore,
  handleOptions,
  jsonResponse,
  keyForGroup,
  sanitizeAnswerPayload
} from "./_shared.mjs";

export default async function handler(request) {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const payload = await request.json();
    const cleanPayload = sanitizeAnswerPayload(payload);
    const store = getAnswerStore();

    // Jede Gruppe wird in einem eigenen Blob gespeichert.
    // Dadurch können mehrere Gruppen fast gleichzeitig speichern,
    // ohne sich gegenseitig eine gemeinsame answers.json zu überschreiben.
    await store.setJSON(keyForGroup(cleanPayload.groupId), cleanPayload);

    return jsonResponse({ ok: true, data: cleanPayload });
  } catch (error) {
    console.error("save-answer failed:", error);
    return jsonResponse({
      ok: false,
      error: "Antworten konnten nicht gespeichert werden."
    }, 500);
  }
}

export const config = {
  path: "/api/save"
};
