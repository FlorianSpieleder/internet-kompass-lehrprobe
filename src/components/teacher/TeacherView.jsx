import { useEffect, useState } from "react";
import { CASES, getAllCaseIds } from "../../data/cases.js";

const APP_VERSION = "student-v2";

const ENTRY_CASE = {
  groupName: "Einstieg",
  title: "Privater Screenshot im Klassenchat",
  focus: "Private Inhalte nur mit Erlaubnis teilen",
  q1: "Ein privater Chat/Screenshot wird in den Klassenchat gestellt.",
  q2: "Speicherung, Screenshot/Weitergabe, größerer Empfängerkreis, Kontextverlust, Kontrollverlust.",
  q3: "Private Unsicherheit wird offengelegt; Tom verliert Kontrolle über die Information; Vertrauen kann beschädigt werden.",
  q4: "Screenshot löschen, entschuldigen, privat klären und private Inhalte künftig nur mit Erlaubnis teilen."
};

const ARRAY_ANSWER_IDS = new Set(["q1", "q2"]);
const ALL_ANSWER_IDS = ["q1", "q2", "q3", "q4"];
const MAX_TEXT_ANSWER_LENGTH = 2500;
const MAX_ARRAY_ANSWER_LENGTH = 250;

function normalizeArrayAnswer(value, maxEntries = 2) {
  const rawEntries = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim()
      ? [value]
      : [];

  return rawEntries
    .map((entry) => String(entry ?? "").trim().slice(0, MAX_ARRAY_ANSWER_LENGTH))
    .filter(Boolean)
    .slice(0, maxEntries);
}

function normalizeAnswer(questionId, value) {
  if (ARRAY_ANSWER_IDS.has(questionId)) {
    return normalizeArrayAnswer(value);
  }

  return String(value ?? "").slice(0, MAX_TEXT_ANSWER_LENGTH);
}

function normalizeAnswers(rawAnswers) {
  const source = rawAnswers && typeof rawAnswers === "object" ? rawAnswers : {};
  return {
    q1: normalizeAnswer("q1", source.q1),
    q2: normalizeAnswer("q2", source.q2),
    q3: normalizeAnswer("q3", source.q3),
    q4: normalizeAnswer("q4", source.q4)
  };
}

function normalizeSavedGroup(groupId, rawGroup) {
  const caseData = CASES[groupId];

  return {
    groupId,
    title: String(rawGroup?.title ?? caseData?.title ?? ""),
    focus: String(rawGroup?.focus ?? caseData?.focus ?? ""),
    answers: normalizeAnswers(rawGroup?.answers),
    savedAt: rawGroup?.savedAt || null,
    receivedAt: rawGroup?.receivedAt || rawGroup?.savedAt || null,
    importedAt: rawGroup?.importedAt || null,
    finalSaveClicked: Boolean(rawGroup?.finalSaveClicked),
    importedManually: Boolean(rawGroup?.importedManually)
  };
}

function normalizeGroups(rawGroups) {
  const source = rawGroups && typeof rawGroups === "object" ? rawGroups : {};
  const groups = {};

  getAllCaseIds().forEach((groupId) => {
    if (source[groupId]) {
      groups[groupId] = normalizeSavedGroup(groupId, source[groupId]);
    }
  });

  return groups;
}

function isAnswerFilled(answer) {
  if (Array.isArray(answer)) {
    return answer.length > 0;
  }

  return String(answer ?? "").trim().length > 0;
}

function formatTime(isoString) {
  if (!isoString) return "-";
  try {
    return new Date(isoString).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "-";
  }
}

function answerText(savedGroup, questionId) {
  const answer = normalizeAnswer(questionId, savedGroup?.answers?.[questionId]);

  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer.join("\n") : "Noch keine Antwort gespeichert.";
  }

  return String(answer ?? "").trim() || "Noch keine Antwort gespeichert.";
}

function answerEntries(savedGroup, questionId) {
  const answer = normalizeAnswer(questionId, savedGroup?.answers?.[questionId]);

  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer : ["Noch keine Antwort gespeichert."];
  }

  const text = String(answer ?? "").trim();
  return text ? [text] : ["Noch keine Antwort gespeichert."];
}

function getMessageValue(message, index) {
  return `${index + 1}. ${message.sender} (${message.time}): ${message.text}`;
}

function textPartFromMessageValue(value) {
  const text = String(value ?? "");
  const marker = "): ";
  const markerIndex = text.indexOf(marker);
  return markerIndex >= 0 ? text.slice(markerIndex + marker.length).trim() : text.trim();
}

function isChatMessageSelected(message, index, selectedMessages) {
  const messageValue = getMessageValue(message, index);
  const messageText = String(message.text ?? "").trim();

  return selectedMessages.some((selectedMessage) => {
    const selectedText = textPartFromMessageValue(selectedMessage);
    return selectedMessage === messageValue || selectedText === messageText || selectedMessage.includes(messageText);
  });
}

function TeacherCaseChat({ caseData, selectedMessages, showSelections }) {
  const chatMessages = caseData.overviewChat ?? caseData.studentChat ?? caseData.fallbackChat ?? [];

  return (
    <div className="teacher-case-chat">
      <div className="teacher-case-chat-header">
        <span>Klassenchat 7b</span>
        <small>Heute</small>
      </div>

      <div className="teacher-case-chat-body">
        {chatMessages.map((message, index) => {
          const lowerText = String(message.text ?? "").toLowerCase();
          const isSystemMessage =
            lowerText.includes("bild wurde gesendet") ||
            lowerText.includes("screenshot wurde gesendet");
          const isSelected = showSelections && isChatMessageSelected(message, index, selectedMessages);

          if (isSystemMessage) {
            return (
              <div
                key={`${message.sender}-${message.time}-${index}`}
                className={`teacher-case-system-message ${isSelected ? "is-selected" : ""}`}
              >
                {message.text}
              </div>
            );
          }

          return (
            <div
              key={`${message.sender}-${message.time}-${index}`}
              className={`teacher-case-message ${isSelected ? "is-selected" : ""}`}
            >
              <div className="teacher-case-message-meta">
                {message.sender} · {message.time}
              </div>
              <div>{message.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Serverfehler ${response.status}`);
  }

  return response.json();
}

function decodeAnswerCode(code) {
  const trimmed = String(code ?? "").trim();
  const withoutPrefix = trimmed.startsWith("IK1.") ? trimmed.slice(4) : trimmed;

  const normalized = withoutPrefix
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(withoutPrefix.length / 4) * 4, "=");

  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  const parsedPayload = JSON.parse(json);
  const payload = parsedPayload && typeof parsedPayload === "object" ? parsedPayload : {};

  const groupId = String(payload.groupId ?? "");
  if (!["1", "2", "3", "4"].includes(groupId)) {
    throw new Error("Der Code enthält keine gültige Gruppe.");
  }

  const answers = {};
  for (const questionId of ALL_ANSWER_IDS) {
    const rawAnswer = payload.answers?.[questionId];
    answers[questionId] = normalizeAnswer(questionId, rawAnswer);
  }

  const now = new Date().toISOString();

  return {
    groupId,
    title: String(payload.title ?? CASES[groupId]?.title ?? ""),
    focus: String(payload.focus ?? CASES[groupId]?.focus ?? ""),
    answers,
    savedAt: payload.savedAt || now,
    receivedAt: now,
    importedAt: now,
    finalSaveClicked: true,
    importedManually: true
  };
}

function teacherImportStorageKey() {
  return `internet-kompass:${APP_VERSION}:teacher-imports`;
}

function readTeacherImports() {
  try {
    const raw = window.localStorage.getItem(teacherImportStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return normalizeGroups(parsed);
  } catch {
    return {};
  }
}

function writeTeacherImports(groups) {
  try {
    window.localStorage.setItem(teacherImportStorageKey(), JSON.stringify(normalizeGroups(groups)));
  } catch (error) {
    console.warn("Manuelle Importe konnten nicht lokal gespeichert werden:", error);
  }
}

function mergeGroups(serverGroups, importedGroups) {
  return {
    ...normalizeGroups(serverGroups),
    ...normalizeGroups(importedGroups)
  };
}

function TeacherImportPanel({ onImport }) {
  const [code, setCode] = useState("");
  const [importState, setImportState] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleImport() {
    setImportState("idle");
    setMessage("");

    try {
      const importedGroup = decodeAnswerCode(code);
      onImport(importedGroup);
      setImportState("success");
      setMessage(`${CASES[importedGroup.groupId]?.groupName ?? "Gruppe"} wurde importiert.`);
      setCode("");

      postJson("/api/save", importedGroup).catch(() => {});
    } catch (error) {
      setImportState("error");
      setMessage(error.message || "Der Antwortcode konnte nicht gelesen werden.");
    }
  }

  return (
    <section className="teacher-import-panel">
      <div>
        <p className="eyebrow">Notfall-Import</p>
        <h2>Antwortcode einer Gruppe importieren</h2>
        <p>
          Den Code von einem Schüler-PC hier einfügen. Die Antwort erscheint danach sofort in der Lehrerversion,
          auch wenn die automatische Übertragung nicht funktioniert.
        </p>
      </div>

      <textarea
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder="Antwortcode hier einfügen, beginnt z. B. mit IK1...."
        rows={4}
      />

      <div className="teacher-import-actions">
        <button className="primary-button" type="button" onClick={handleImport} disabled={!code.trim()}>
          Code importieren
        </button>
      </div>

      {importState === "success" && <div className="notice notice-success">{message}</div>}
      {importState === "error" && <div className="notice notice-error">{message}</div>}
    </section>
  );
}

function TeacherStatusCards({ answersData, selectedGroupId, onSelectGroup }) {
  return (
    <div className="teacher-status-grid">
      {getAllCaseIds().map((id) => {
        const caseData = CASES[id];
        const savedGroup = answersData.groups?.[id];
        const answeredCount = savedGroup
          ? Object.values(normalizeAnswers(savedGroup.answers)).filter(isAnswerFilled).length
          : 0;

        return (
          <button
            key={id}
            className={`teacher-status-card ${selectedGroupId === id ? "is-selected" : ""}`}
            onClick={() => onSelectGroup(id)}
          >
            <div className="status-topline">
              <span>{caseData.groupName}</span>
              <strong className={savedGroup ? "status-saved" : "status-missing"}>
                {savedGroup?.importedManually ? "importiert" : savedGroup ? "gespeichert" : "offen"}
              </strong>
            </div>
            <h3>{caseData.title}</h3>
            <p>{answeredCount}/{caseData.questions.length} Antworten - zuletzt: {formatTime(savedGroup?.receivedAt || savedGroup?.savedAt)}</p>
          </button>
        );
      })}
    </div>
  );
}

function TeacherAnswerCard({ question, savedGroup, index }) {
  const entries = answerEntries(savedGroup, question.id);
  const isMissing = !savedGroup || entries.every((entry) => entry === "Noch keine Antwort gespeichert.");

  return (
    <article className={`teacher-presentation-answer ${isMissing ? "is-missing" : ""}`}>
      <div className="teacher-answer-heading">
        <span className="teacher-answer-number">{index + 1}</span>
        <h3>{question.label}</h3>
      </div>

      <ul>
        {entries.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
    </article>
  );
}

function GroupPresentationCard({ groupId, answersData, onBack }) {
  const caseData = CASES[groupId];
  const savedGroup = answersData.groups?.[groupId];
  const [isRevealed, setIsRevealed] = useState(false);
  const selectedMessages = normalizeAnswer("q1", savedGroup?.answers?.q1);

  useEffect(() => {
    setIsRevealed(false);
  }, [groupId]);

  if (!caseData) return null;

  return (
    <section className="teacher-presentation-card">
      <div className="teacher-presentation-header">
        <div>
          <p className="eyebrow">{caseData.groupName}</p>
          <h2>{caseData.title}</h2>
        </div>

        <button className="secondary-button" type="button" onClick={onBack}>
          Zurück
        </button>
      </div>

      <div className={`teacher-presentation-body ${isRevealed ? "is-revealed" : ""}`}>
        <TeacherCaseChat
          caseData={caseData}
          selectedMessages={selectedMessages}
          showSelections={isRevealed}
        />

        <aside className="teacher-presentation-side">
          {!isRevealed ? (
            <div className="teacher-reveal-row">
              <button className="primary-button" type="button" onClick={() => setIsRevealed(true)}>
                Knackpunkt aufdecken
              </button>
            </div>
          ) : (
            <div className="teacher-presentation-grid">
              {caseData.questions
                .filter((question) => question.id !== "q1")
                .map((question, index) => (
                  <TeacherAnswerCard
                    key={question.id}
                    question={question}
                    savedGroup={savedGroup}
                    index={index + 1}
                  />
                ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function CompactOverviewTable({ answersData }) {
  const rows = [
    {
      id: "entry",
      label: ENTRY_CASE.groupName,
      title: ENTRY_CASE.title,
      q1: ENTRY_CASE.q1,
      q2: ENTRY_CASE.q2,
      q3: ENTRY_CASE.q3,
      q4: ENTRY_CASE.q4
    },
    ...getAllCaseIds().map((id) => {
      const caseData = CASES[id];
      const savedGroup = answersData.groups?.[id];
      return {
        id,
        label: caseData.groupName,
        title: caseData.title,
        q1: answerText(savedGroup, "q1"),
        q2: answerText(savedGroup, "q2"),
        q3: answerText(savedGroup, "q3"),
        q4: answerText(savedGroup, "q4")
      };
    })
  ];

  return (
    <section className="overview-table-card">
      <div className="table-scroll">
        <table className="compact-table">
          <thead>
            <tr>
              <th>Fall</th>
              <th>Problematische Handlung</th>
              <th>Digitale Eigenschaft</th>
              <th>Mögliche Folge</th>
              <th>Verantwortungsvolle Reaktion / Regelrichtung</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th>
                  <span>{row.label}</span>
                  <small>{row.title}</small>
                </th>
                <td>{row.q1}</td>
                <td>{row.q2}</td>
                <td>{row.q3}</td>
                <td>{row.q4}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function TeacherView() {
  const [answersData, setAnswersData] = useState(() => ({
    groups: readTeacherImports(),
    updatedAt: null
  }));
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [mode, setMode] = useState("cards");
  const [showImport, setShowImport] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [loadState, setLoadState] = useState("idle");

  async function loadAnswers() {
    setIsOptionsOpen(false);
    setLoadState("loading");
    try {
      const response = await fetch(`/api/answers?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Serverfehler ${response.status}`);
      const result = await response.json();
      const importedGroups = readTeacherImports();
      const serverData = result.data ?? { groups: {}, updatedAt: null };
      setAnswersData({
        ...serverData,
        groups: mergeGroups(serverData.groups, importedGroups)
      });
      setLoadState("success");
    } catch (error) {
      console.warn("Antworten konnten nicht geladen werden:", error);
      setLoadState("error");
    }
  }

  async function resetAnswers() {
    setIsOptionsOpen(false);
    const confirmed = window.confirm("Wirklich alle gespeicherten Gruppenantworten für diese Stunde löschen?");
    if (!confirmed) return;

    setLoadState("loading");
    try {
      const result = await postJson("/api/reset", {});
      writeTeacherImports({});
      setAnswersData({
        ...(result.data ?? { groups: {}, updatedAt: null }),
        groups: {}
      });
      setLoadState("success");
    } catch (error) {
      console.warn("Antworten konnten nicht gelöscht werden:", error);
      setLoadState("error");
    }
  }

  function handleManualImport(importedGroup) {
    const currentImports = readTeacherImports();
    const nextImports = {
      ...currentImports,
      [importedGroup.groupId]: normalizeSavedGroup(importedGroup.groupId, importedGroup)
    };

    writeTeacherImports(nextImports);

    setAnswersData((current) => ({
      ...current,
      groups: {
        ...(current.groups ?? {}),
        [importedGroup.groupId]: normalizeSavedGroup(importedGroup.groupId, importedGroup)
      },
      updatedAt: importedGroup.importedAt || new Date().toISOString()
    }));

    setSelectedGroupId(importedGroup.groupId);
    setMode("cards");
  }

  useEffect(() => {
    loadAnswers();
  }, []);

  return (
    <main className={`teacher-layout ${selectedGroupId && mode === "cards" ? "is-presenting" : ""}`}>
      {(!selectedGroupId || mode !== "cards") && (
        <header className="teacher-header">
          <div>
            <h1>Gruppenübersicht</h1>
          </div>

          <div className="teacher-actions">
            <div className="teacher-view-toggle" aria-label="Ansicht">
              <button
                className={`secondary-button ${mode === "cards" ? "is-active" : ""}`}
                onClick={() => setMode("cards")}
              >
                Lernkarten
              </button>
              <button
                className={`secondary-button ${mode === "table" ? "is-active" : ""}`}
                onClick={() => setMode("table")}
              >
                Tabelle
              </button>
            </div>

            <div className="teacher-options-menu">
              <button
                className={`teacher-options-button ${isOptionsOpen ? "is-active" : ""}`}
                type="button"
                aria-label="Optionen"
                aria-expanded={isOptionsOpen}
                onClick={() => setIsOptionsOpen((current) => !current)}
              >
                ⋮
              </button>

              {isOptionsOpen && (
                <div className="teacher-options-dropdown">
                  <button type="button" onClick={loadAnswers}>
                    Antworten aktualisieren
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImport((current) => !current);
                      setIsOptionsOpen(false);
                    }}
                  >
                    {showImport ? "Import ausblenden" : "Antwortcode importieren"}
                  </button>
                  <button className="is-danger" type="button" onClick={resetAnswers}>
                    Stunde zurücksetzen
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {loadState === "loading" && <div className="notice notice-neutral">Antworten werden geladen ...</div>}
      {loadState === "error" && (
        <div className="notice notice-error">
          Die automatische Synchronisation ist gerade nicht erreichbar. Du kannst trotzdem Antwortcodes manuell importieren.
        </div>
      )}

      {showImport && <TeacherImportPanel onImport={handleManualImport} />}

      {mode === "cards" ? (
        selectedGroupId ? (
          <GroupPresentationCard
            groupId={selectedGroupId}
            answersData={answersData}
            onBack={() => setSelectedGroupId(null)}
          />
        ) : (
          <TeacherStatusCards
            answersData={answersData}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />
        )
      ) : (
        <CompactOverviewTable answersData={answersData} />
      )}
    </main>
  );
}
