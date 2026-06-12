import { useEffect, useState } from "react";
import { CASES, getAllCaseIds } from "../../data/cases.js";

const APP_VERSION = "student-v2";
const GROUP_AVATAR_SRC = "/chatbilder/klassenchat-7b-avatar.png";

const ENTRY_CASE = {
  groupName: "Einstieg",
  title: "Privater Screenshot im Klassenchat",
  focus: "Private Inhalte nur mit Erlaubnis teilen",
  q1: "Ein privater Chat/Screenshot wird in den Klassenchat gestellt.",
  q2: "Speicherung, Screenshot/Weitergabe, größerer Empfängerkreis, Kontextverlust, Kontrollverlust.",
  q3: "Private Unsicherheit wird offengelegt; Tom verliert Kontrolle über die Information; Vertrauen kann beschädigt werden.",
  q4: "Screenshot löschen, entschuldigen, privat klären und private Inhalte künftig nur mit Erlaubnis teilen."
};

const ARRAY_ANSWER_TYPES = new Set(["message-select", "property-select", "checklist"]);
const RULE_SENTENCE_ANSWER_TYPE = "rule-sentence";
const MAX_TEXT_ANSWER_LENGTH = 2500;
const MAX_RULE_PART_LENGTH = 90;
const MAX_ARRAY_ANSWER_LENGTH = 250;

function emptyPermissions() {
  const matrix = {};
  const groupModes = {};

  getAllCaseIds().forEach((groupId) => {
    groupModes[groupId] = "student";
    matrix[groupId] = {};
    getAllCaseIds().forEach((caseId) => {
      matrix[groupId][caseId] = false;
    });
  });

  return { matrix, groupModes, updatedAt: null };
}

function normalizePermissions(rawPermissions) {
  const sourceMatrix = rawPermissions?.matrix && typeof rawPermissions.matrix === "object"
    ? rawPermissions.matrix
    : {};
  const sourceGroupModes = rawPermissions?.groupModes && typeof rawPermissions.groupModes === "object"
    ? rawPermissions.groupModes
    : {};
  const permissions = emptyPermissions();

  getAllCaseIds().forEach((groupId) => {
    const sourceRow = sourceMatrix[groupId] && typeof sourceMatrix[groupId] === "object"
      ? sourceMatrix[groupId]
      : {};

    getAllCaseIds().forEach((caseId) => {
      permissions.matrix[groupId][caseId] = Boolean(sourceRow[caseId]);
    });

    permissions.groupModes[groupId] = sourceGroupModes[groupId] === "overview"
      ? "overview"
      : "student";
  });

  permissions.updatedAt = rawPermissions?.updatedAt ?? null;
  return permissions;
}

function getInitials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarClass(sender) {
  const names = [
    "Luca",
    "Mia",
    "Sina",
    "Jonas",
    "Emir",
    "Lea",
    "Noah",
    "Paula",
    "Max",
    "Leni",
    "Ben",
    "Timo",
    "Felix",
    "Sara",
    "Nina",
    "Tom"
  ];

  const index = Math.max(names.indexOf(sender), 0);
  return `wa-avatar-${(index % 6) + 1}`;
}

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

function normalizeAnswerForQuestion(question, value) {
  if (ARRAY_ANSWER_TYPES.has(question?.type)) {
    return normalizeArrayAnswer(value, question?.maxSelections ?? question?.options?.length ?? 2);
  }

  if (question?.type === RULE_SENTENCE_ANSWER_TYPE) {
    const maxLength = question.maxLength ?? MAX_RULE_PART_LENGTH;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return {
        rule: String(value.rule ?? "").slice(0, maxLength),
        reason: String(value.reason ?? "").slice(0, maxLength)
      };
    }

    return {
      rule: String(value ?? "").slice(0, maxLength),
      reason: ""
    };
  }

  return String(value ?? "").slice(0, MAX_TEXT_ANSWER_LENGTH);
}

function formatRuleSentence(answer) {
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
    return "";
  }

  const rule = String(answer.rule ?? "").trim();
  const reason = String(answer.reason ?? "").trim();
  const sentences = [];

  if (rule) {
    sentences.push(`Regel: ${rule}.`);
  }

  if (reason) {
    sentences.push(`Begründung: ${reason}.`);
  }

  return sentences.join("\n");
}

function normalizeAnswersForCase(caseData, rawAnswers) {
  const source = rawAnswers && typeof rawAnswers === "object" ? rawAnswers : {};
  const answers = {};

  caseData?.questions?.forEach((question) => {
    answers[question.id] = normalizeAnswerForQuestion(question, source[question.id]);
  });

  return answers;
}

function normalizeSavedGroup(groupId, rawGroup) {
  const caseData = CASES[groupId];

  return {
    groupId,
    title: String(rawGroup?.title ?? caseData?.title ?? ""),
    focus: String(rawGroup?.focus ?? caseData?.focus ?? ""),
    answers: normalizeAnswersForCase(caseData, rawGroup?.answers),
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

  if (answer && typeof answer === "object") {
    return Object.values(answer).some((entry) => String(entry ?? "").trim().length > 0);
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

function questionById(caseData, questionId) {
  return caseData?.questions?.find((question) => question.id === questionId) ?? null;
}

function answerText(savedGroup, questionId) {
  const caseData = CASES[savedGroup?.groupId];
  const question = questionById(caseData, questionId);
  const answer = normalizeAnswerForQuestion(question, savedGroup?.answers?.[questionId]);

  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer.join("\n") : "Noch keine Antwort gespeichert.";
  }

  if (answer && typeof answer === "object") {
    return formatRuleSentence(answer) || "Noch keine Antwort gespeichert.";
  }

  return String(answer ?? "").trim() || "Noch keine Antwort gespeichert.";
}

function selectedProperties(savedGroup) {
  const question = questionById(CASES[savedGroup?.groupId], "q2");
  const answer = normalizeAnswerForQuestion(question, savedGroup?.answers?.q2);
  return Array.isArray(answer) && answer.length > 0 ? answer : ["Noch keine Eigenschaften gewählt."];
}

function ruleOnlyText(savedGroup) {
  const caseData = CASES[savedGroup?.groupId];
  const question = questionById(caseData, "q5");
  const answer = normalizeAnswerForQuestion(question, savedGroup?.answers?.q5);

  if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
    return "Noch keine Regel gespeichert.";
  }

  return String(answer.rule ?? "").trim() || "Noch keine Regel gespeichert.";
}

function answerEntries(savedGroup, question) {
  const answer = normalizeAnswerForQuestion(question, savedGroup?.answers?.[question.id]);

  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer : ["Noch keine Antwort gespeichert."];
  }

  if (answer && typeof answer === "object") {
    const sentence = formatRuleSentence(answer);
    return sentence ? sentence.split("\n").filter(Boolean) : ["Noch keine Antwort gespeichert."];
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

function TeacherCaseChat({ caseData, selectedMessages = [] }) {
  const chatMessages = caseData.studentChat ?? caseData.fallbackChat ?? caseData.overviewChat ?? [];
  const [groupImageFailed, setGroupImageFailed] = useState(false);

  return (
    <div className="teacher-case-chat">
      <div className="teacher-case-chat-header">
        {!groupImageFailed ? (
          <img
            className="teacher-group-avatar-image"
            src={GROUP_AVATAR_SRC}
            alt="Profilbild des Klassenchats"
            onError={() => setGroupImageFailed(true)}
          />
        ) : (
          <div className="teacher-group-avatar-fallback">7b</div>
        )}

        <div className="teacher-case-chat-title">
          <span>Klassenchat 7b</span>
          <small>Heute</small>
        </div>
      </div>

      <div className="teacher-case-chat-body">
        {chatMessages.map((message, index) => {
          const lowerText = String(message.text ?? "").toLowerCase();
          const isSystemMessage =
            lowerText.includes("bild wurde gesendet") ||
            lowerText.includes("screenshot wurde gesendet");
          const isSelected = isChatMessageSelected(message, index, selectedMessages);

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
            <div className="teacher-case-message-row" key={`${message.sender}-${message.time}-${index}`}>
              <div className={`wa-avatar ${getAvatarClass(message.sender)}`}>
                {getInitials(message.sender)}
              </div>

              <div className={`teacher-case-message ${isSelected ? "is-selected" : ""}`}>
                <div className="teacher-case-message-meta">
                  {message.sender} · {message.time}
                </div>
                <div>{message.text}</div>
              </div>
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

  const answers = normalizeAnswersForCase(CASES[groupId], payload.answers);

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

function TeacherStatusCards({
  answersData,
  selectedGroupId,
  onSelectGroup,
  caseIds = getAllCaseIds(),
  extraInfoCaseIds = []
}) {
  return (
    <div className="teacher-status-grid">
      {caseIds.map((id) => {
        const caseData = CASES[id];
        const savedGroup = answersData.groups?.[id];
        const hasExtraInfo = extraInfoCaseIds.includes(id);
        const answeredCount = savedGroup
          ? Object.values(normalizeAnswersForCase(caseData, savedGroup.answers)).filter(isAnswerFilled).length
          : 0;

        return (
          <button
            key={id}
            className={`teacher-status-card ${selectedGroupId === id ? "is-selected" : ""} ${hasExtraInfo ? "has-extra-info" : ""}`}
            onClick={() => onSelectGroup(id)}
          >
            <div className="status-topline">
              <span>{caseData.groupName}</span>
              <strong className={savedGroup ? "status-saved" : "status-missing"}>
                {savedGroup?.importedManually ? "importiert" : savedGroup ? "gespeichert" : "offen"}
              </strong>
            </div>
            {hasExtraInfo && <span className="extra-info-badge">Zusatzinfos</span>}
            <h3>{caseData.title}</h3>
            <p>{answeredCount}/{caseData.questions.length} Antworten - zuletzt: {formatTime(savedGroup?.receivedAt || savedGroup?.savedAt)}</p>
          </button>
        );
      })}
    </div>
  );
}

function TeacherResultCard({ title, children, isMissing = false }) {
  return (
    <article className={`teacher-presentation-answer teacher-result-card ${isMissing ? "is-missing" : ""}`}>
      <div className="teacher-result-heading">
        <h3>{title}</h3>
      </div>
      {children}
    </article>
  );
}

function TeacherAnswerCard({ question, savedGroup, index }) {
  const entries = answerEntries(savedGroup, question);
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

function GroupPresentationCard({ groupId, answersData, onBack, showExtendedInfo = false }) {
  const caseData = CASES[groupId];
  const savedGroup = answersData.groups?.[groupId];
  const properties = selectedProperties(savedGroup);
  const rule = ruleOnlyText(savedGroup);
  const selectedMessages = showExtendedInfo
    ? normalizeAnswerForQuestion(questionById(caseData, "q1"), savedGroup?.answers?.q1)
    : [];

  if (!caseData) return null;

  return (
    <section className="teacher-presentation-card">
      <div className="teacher-presentation-header">
        <div>
          <h2>{caseData.groupName}</h2>
        </div>

        <button className="teacher-back-button" type="button" aria-label="Zurück zur Gruppenübersicht" onClick={onBack}>
          <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path d="M13.3 8.4 6.2 15.5l7.1 7.1" />
            <path d="M7.2 15.5h12.1c4.2 0 6.5 2.2 6.5 5.4 0 1.5-.5 2.9-1.5 4" />
          </svg>
        </button>
      </div>

      <div className="teacher-presentation-body">
        <TeacherCaseChat caseData={caseData} selectedMessages={selectedMessages} />

        <aside className="teacher-presentation-side">
          <div className="teacher-presentation-grid">
            {showExtendedInfo ? (
              caseData.questions
                .filter((question) => ["q2", "q3", "q4", "q5"].includes(question.id))
                .map((question, index) => (
                  <TeacherAnswerCard
                    key={question.id}
                    question={question}
                    savedGroup={savedGroup}
                    index={index + 1}
                  />
                ))
            ) : (
              <>
                <TeacherResultCard
                  title={`Unsere Regel für Fall ${groupId}`}
                  isMissing={!savedGroup || rule === "Noch keine Regel gespeichert."}
                >
                  <p className="teacher-rule-only">{rule}</p>
                </TeacherResultCard>

                <TeacherResultCard
                  title="Gewählte Eigenschaften"
                  isMissing={!savedGroup || properties[0] === "Noch keine Eigenschaften gewählt."}
                >
                  <ul>
                    {properties.map((property) => (
                      <li key={property}>{property}</li>
                    ))}
                  </ul>
                </TeacherResultCard>
              </>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function CompactOverviewTable({ answersData, caseIds = getAllCaseIds() }) {
  const rows = caseIds.map((id) => {
      const caseData = CASES[id];
      const savedGroup = answersData.groups?.[id];
      return {
        id,
        label: caseData.groupName,
        title: caseData.title,
        properties: selectedProperties(savedGroup),
        rule: ruleOnlyText(savedGroup)
      };
    });

  return (
    <section className="overview-table-card">
      <div className="table-scroll">
        <table className="compact-table">
          <thead>
            <tr>
              <th>Fall</th>
              <th>Digitale Eigenschaft</th>
              <th>Regel</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th>
                  <span>{row.label}</span>
                  <small>{row.title}</small>
                </th>
                <td>
                  <ul className="compact-table-list">
                    {row.properties.map((property) => (
                      <li key={property}>{property}</li>
                    ))}
                  </ul>
                </td>
                <td>{row.rule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function TeacherView({ viewerGroupId = null }) {
  const isScopedResultView = Boolean(viewerGroupId);
  const [answersData, setAnswersData] = useState(() => ({
    groups: readTeacherImports(),
    updatedAt: null
  }));
  const [permissions, setPermissions] = useState(emptyPermissions);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [mode, setMode] = useState("cards");
  const [showImport, setShowImport] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [loadState, setLoadState] = useState("idle");

  async function loadAnswers() {
    setIsOptionsOpen(false);
    setLoadState("loading");
    try {
      const [response, permissionsResponse] = await Promise.all([
        fetch(`/api/answers?t=${Date.now()}`, { cache: "no-store" }),
        isScopedResultView
          ? fetch(`/api/permissions?t=${Date.now()}`, { cache: "no-store" })
          : Promise.resolve(null)
      ]);
      if (!response.ok) throw new Error(`Serverfehler ${response.status}`);
      const result = await response.json();
      if (permissionsResponse) {
        if (!permissionsResponse.ok) throw new Error(`Serverfehler ${permissionsResponse.status}`);
        const permissionsResult = await permissionsResponse.json();
        setPermissions(normalizePermissions(permissionsResult.data));
      }
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
  }, [viewerGroupId]);

  useEffect(() => {
    if (isScopedResultView && mode !== "cards") {
      setMode("cards");
    }
  }, [isScopedResultView, mode]);

  const extraInfoCaseIds = isScopedResultView
    ? getAllCaseIds().filter((caseId) => permissions.matrix?.[viewerGroupId]?.[caseId])
    : getAllCaseIds();
  const visibleCaseIds = getAllCaseIds();

  useEffect(() => {
    if (selectedGroupId && !visibleCaseIds.includes(selectedGroupId)) {
      setSelectedGroupId(null);
    }
  }, [visibleCaseIds.join(","), selectedGroupId]);

  return (
    <main className={`teacher-layout ${selectedGroupId && mode === "cards" ? "is-presenting" : ""}`}>
      {(!selectedGroupId || mode !== "cards") && (
        <header className="teacher-header">
          <div>
            <h1>{isScopedResultView ? `Ergebnisse für Gruppe ${viewerGroupId}` : "Gruppenübersicht"}</h1>
          </div>

          <div className="teacher-actions">
            {!isScopedResultView && (
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
            )}

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
                  {!isScopedResultView && (
                    <>
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
                    </>
                  )}
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

      {showImport && !isScopedResultView && <TeacherImportPanel onImport={handleManualImport} />}

      {isScopedResultView && extraInfoCaseIds.length === 0 && loadState !== "loading" && (
        <div className="notice notice-neutral">
          Für diese Gruppe sind noch keine Zusatzinformationen freigegeben. Alle Fälle bleiben in der normalen Übersicht verfügbar.
        </div>
      )}

      {mode === "cards" ? (
        selectedGroupId ? (
          <GroupPresentationCard
            groupId={selectedGroupId}
            answersData={answersData}
            onBack={() => setSelectedGroupId(null)}
            showExtendedInfo={extraInfoCaseIds.includes(selectedGroupId)}
          />
        ) : (
          <TeacherStatusCards
            answersData={answersData}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            caseIds={visibleCaseIds}
            extraInfoCaseIds={extraInfoCaseIds}
          />
        )
      ) : (
        <CompactOverviewTable answersData={answersData} caseIds={visibleCaseIds} />
      )}
    </main>
  );
}
