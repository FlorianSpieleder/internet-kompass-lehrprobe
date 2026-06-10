import {
  GROUP_IDS,
  getAnswerStore,
  handleOptions,
  jsonResponse,
  keyForGroup
} from "./_shared.mjs";

export default async function handler(request) {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const store = getAnswerStore();

    await Promise.all(
      GROUP_IDS.map((groupId) => store.delete(keyForGroup(groupId)))
    );

    return jsonResponse({
      ok: true,
      data: {
        groups: {},
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("reset-answers failed:", error);
    return jsonResponse({
      ok: false,
      error: "Antworten konnten nicht zurückgesetzt werden."
    }, 500);
  }
}

export const config = {
  path: "/api/reset"
};
