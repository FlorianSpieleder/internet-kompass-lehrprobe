import { getStore } from "@netlify/blobs";

export const GROUP_IDS = ["1", "2", "3", "4"];
const ARRAY_ANSWER_IDS = new Set(["q1", "q2"]);
const ANSWER_IDS = ["q1", "q2", "q3", "q4"];
const MAX_TEXT_ANSWER_LENGTH = 2500;
const MAX_ARRAY_ANSWER_LENGTH = 250;
const MAX_ARRAY_ENTRIES = 2;

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

function sanitizeArrayAnswer(value) {
  const rawEntries = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim()
      ? [value]
      : [];

  return rawEntries
    .map((entry) => String(entry ?? "").trim().slice(0, MAX_ARRAY_ANSWER_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_ARRAY_ENTRIES);
}

function sanitizeAnswer(questionId, value) {
  if (ARRAY_ANSWER_IDS.has(questionId)) {
    return sanitizeArrayAnswer(value);
  }

  return String(value ?? "").slice(0, MAX_TEXT_ANSWER_LENGTH);
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

  for (const questionId of ANSWER_IDS) {
    answers[questionId] = sanitizeAnswer(questionId, rawAnswers[questionId]);
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

export function sanitizeStoredGroup(groupId, payload) {
  const cleanPayload = sanitizeAnswerPayload({
    ...(payload && typeof payload === "object" ? payload : {}),
    groupId
  });

  return {
    ...cleanPayload,
    savedAt: payload?.savedAt || cleanPayload.savedAt,
    receivedAt: payload?.receivedAt || cleanPayload.receivedAt,
    importedAt: payload?.importedAt || null,
    importedManually: Boolean(payload?.importedManually),
    finalSaveClicked: Boolean(payload?.finalSaveClicked ?? cleanPayload.finalSaveClicked)
  };
}
