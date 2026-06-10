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

  if (request.method !== "GET") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const store = getAnswerStore();
    const groups = {};
    let latestUpdate = null;

    await Promise.all(
      GROUP_IDS.map(async (groupId) => {
        const data = await store.get(keyForGroup(groupId), {
          type: "json",
          consistency: "strong"
        });

        if (data) {
          groups[groupId] = data;
          const timestamp = data.receivedAt || data.savedAt;
          if (timestamp && (!latestUpdate || timestamp > latestUpdate)) {
            latestUpdate = timestamp;
          }
        }
      })
    );

    return jsonResponse({
      ok: true,
      data: {
        groups,
        updatedAt: latestUpdate
      }
    });
  } catch (error) {
    console.error("get-answers failed:", error);
    return jsonResponse({
      ok: false,
      error: "Antworten konnten nicht geladen werden."
    }, 500);
  }
}

export const config = {
  path: "/api/answers"
};
