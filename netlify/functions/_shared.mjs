import { getStore } from "@netlify/blobs";

export const GROUP_IDS = ["1", "2", "3", "4"];

export function jsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    }
  });
}

export function handleOptions(request) {
  if (request.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  return null;
}

export function getAnswerStore() {
  // Starke Konsistenz ist hier sinnvoll, weil nach dem Speichern
  // auf der Lehrerseite direkt aktualisiert werden soll.
  return getStore({
    name: "internet-kompass-answers",
    consistency: "strong"
  });
}

export function keyForGroup(groupId) {
  return `group-${groupId}`;
}

export function sanitizeAnswerPayload(payload) {
  const groupId = String(payload?.groupId ?? "");

  if (!GROUP_IDS.includes(groupId)) {
    throw new Error("Ungültige Gruppe");
  }

  const answers = {};
  const rawAnswers = payload?.answers && typeof payload.answers === "object"
    ? payload.answers
    : {};

  for (const questionId of ["q1", "q2", "q3", "q4", "q5", "q6"]) {
    answers[questionId] = String(rawAnswers[questionId] ?? "").slice(0, 2500);
  }

  const now = new Date().toISOString();

  return {
    groupId,
    title: String(payload?.title ?? "").slice(0, 200),
    focus: String(payload?.focus ?? "").slice(0, 300),
    answers,
    savedAt: payload?.savedAt || now,
    receivedAt: now,
    finalSaveClicked: true
  };
}
