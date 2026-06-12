import {
  getPermissionStore,
  handleOptions,
  jsonResponse,
  permissionsKey,
  sanitizePermissions
} from "./_shared.mjs";

export default async function handler(request) {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;

  try {
    const store = getPermissionStore();

    if (request.method === "GET") {
      const stored = await store.get(permissionsKey(), {
        type: "json",
        consistency: "strong"
      });

      return jsonResponse({
        ok: true,
        data: sanitizePermissions(stored)
      });
    }

    if (request.method === "POST") {
      const payload = await request.json();
      const cleanPayload = sanitizePermissions(payload);
      await store.setJSON(permissionsKey(), cleanPayload);

      return jsonResponse({
        ok: true,
        data: cleanPayload
      });
    }

    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  } catch (error) {
    console.error("permissions failed:", error);
    return jsonResponse({
      ok: false,
      error: "Leserechte konnten nicht geladen oder gespeichert werden."
    }, 500);
  }
}

export const config = {
  path: "/api/permissions"
};
