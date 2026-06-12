import React, { useEffect, useMemo, useState } from "react";
import { CASES, getAllCaseIds, getCaseById } from "./data/cases.js";
import ChatPanel from "./components/chat/ChatPanel.jsx";
import QuestionSection from "./components/student/QuestionSection.jsx";
import TeacherView from "./components/teacher/TeacherView.jsx";

const APP_VERSION = "student-v2";
const QUESTIONS_PER_PAGE = 1;
const ARRAY_ANSWER_TYPES = new Set(["message-select", "property-select", "checklist"]);
const RULE_SENTENCE_ANSWER_TYPE = "rule-sentence";
const MAX_TEXT_ANSWER_LENGTH = 2500;
const MAX_RULE_PART_LENGTH = 90;
const MAX_ARRAY_ANSWER_LENGTH = 250;


function getInitialGroupId() {
  const params = new URLSearchParams(window.location.search);
  const groupFromUrl = params.get("gruppe") || params.get("fall") || params.get("t");

  if (groupFromUrl === "admin" || params.get("admin") === "1") return "admin";
  if (groupFromUrl === "0" || groupFromUrl === "lehrer") return "0";
  if (["11", "12", "13", "14"].includes(groupFromUrl)) return groupFromUrl;
  if (CASES[groupFromUrl]) return groupFromUrl;
  return null;
}

function storageKey(groupId) {
  return `internet-kompass:${APP_VERSION}:gruppe-${groupId}`;
}

function safeRead(groupId) {
  try {
    const raw = window.localStorage.getItem(storageKey(groupId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Konnte gespeicherte Antworten nicht lesen:", error);
    return null;
  }
}

function safeWrite(groupId, data) {
  try {
    window.localStorage.setItem(storageKey(groupId), JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn("Konnte Antworten nicht speichern:", error);
    return false;
  }
}

function emptyAnswerForQuestion(question) {
  if (ARRAY_ANSWER_TYPES.has(question.type)) {
    return [];
  }

  if (question.type === RULE_SENTENCE_ANSWER_TYPE) {
    return { rule: "", reason: "" };
  }

  return "";
}

function emptyAnswersFor(caseData) {
  const answers = {};
  caseData.questions.forEach((question) => {
    answers[question.id] = emptyAnswerForQuestion(question);
  });
  return answers;
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
  if (ARRAY_ANSWER_TYPES.has(question.type)) {
    return normalizeArrayAnswer(value, question.maxSelections ?? question.options?.length ?? 2);
  }

  if (question.type === RULE_SENTENCE_ANSWER_TYPE) {
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

function normalizeAnswersForCase(caseData, rawAnswers) {
  const normalized = emptyAnswersFor(caseData);
  const source = rawAnswers && typeof rawAnswers === "object" ? rawAnswers : {};

  caseData.questions.forEach((question) => {
    normalized[question.id] = normalizeAnswerForQuestion(question, source[question.id]);
  });

  return normalized;
}

function splitIntoPages(questions) {
  const pages = [];
  for (let i = 0; i < questions.length; i += QUESTIONS_PER_PAGE) {
    pages.push(questions.slice(i, i + QUESTIONS_PER_PAGE));
  }
  return pages;
}

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

function normalizeAnswerGroups(rawGroups) {
  const source = rawGroups && typeof rawGroups === "object" ? rawGroups : {};
  const groups = {};

  getAllCaseIds().forEach((caseId) => {
    const caseData = CASES[caseId];
    const rawGroup = source[caseId];

    if (rawGroup) {
      groups[caseId] = {
        ...rawGroup,
        groupId: caseId,
        title: String(rawGroup.title ?? caseData.title ?? ""),
        focus: String(rawGroup.focus ?? caseData.focus ?? ""),
        answers: normalizeAnswersForCase(caseData, rawGroup.answers)
      };
    }
  });

  return groups;
}

function getMessageValue(message, index) {
  return `${index + 1}. ${message.sender} (${message.time}): ${message.text}`;
}

function isSharedMessageSelected(message, index, selectedMessages) {
  const messageValue = getMessageValue(message, index);
  const messageText = String(message.text ?? "").trim();

  return selectedMessages.some((selectedMessage) => {
    const text = String(selectedMessage ?? "");
    const marker = "): ";
    const markerIndex = text.indexOf(marker);
    const selectedText = markerIndex >= 0 ? text.slice(markerIndex + marker.length).trim() : text.trim();
    return text === messageValue || selectedText === messageText || text.includes(messageText);
  });
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

function AdminPanel() {
  const [permissions, setPermissions] = useState(emptyPermissions);
  const [saveState, setSaveState] = useState("idle");
  const [loadState, setLoadState] = useState("loading");

  async function loadPermissions() {
    setLoadState("loading");

    try {
      const response = await fetch(`/api/permissions?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Serverfehler ${response.status}`);
      const result = await response.json();
      setPermissions(normalizePermissions(result.data));
      setLoadState("success");
    } catch (error) {
      console.warn("Leserechte konnten nicht geladen werden:", error);
      setLoadState("error");
    }
  }

  useEffect(() => {
    loadPermissions();
  }, []);

  function togglePermission(groupId, caseId) {
    setPermissions((current) => {
      const normalized = normalizePermissions(current);

      return {
        ...normalized,
        matrix: {
          ...normalized.matrix,
          [groupId]: {
            ...normalized.matrix[groupId],
            [caseId]: !normalized.matrix[groupId][caseId]
          }
        }
      };
    });
    setSaveState("idle");
  }

  function toggleGroupMode(groupId) {
    setPermissions((current) => {
      const normalized = normalizePermissions(current);
      const nextMode = normalized.groupModes[groupId] === "overview" ? "student" : "overview";

      return {
        ...normalized,
        groupModes: {
          ...normalized.groupModes,
          [groupId]: nextMode
        }
      };
    });
    setSaveState("idle");
  }

  async function savePermissions() {
    setSaveState("saving");

    try {
      const payload = normalizePermissions({
        ...permissions,
        updatedAt: new Date().toISOString()
      });
      const result = await postJson("/api/permissions", payload);
      setPermissions(normalizePermissions(result.data));
      setSaveState("success");
    } catch (error) {
      console.warn("Leserechte konnten nicht gespeichert werden:", error);
      setSaveState("error");
    }
  }

  return (
    <main className="admin-layout">
      <section className="admin-panel">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Adminpanel</p>
            <h1>Erweiterte Leserechte</h1>
          </div>
          <button className="primary-button" type="button" onClick={savePermissions} disabled={saveState === "saving"}>
            {saveState === "saving" ? "Speichert ..." : "Rechte speichern"}
          </button>
        </header>

        {loadState === "error" && (
          <div className="notice notice-error">
            Leserechte konnten nicht geladen werden. Bitte Verbindung prüfen und neu laden.
          </div>
        )}
        {saveState === "success" && <div className="notice notice-success">Leserechte gespeichert.</div>}
        {saveState === "error" && <div className="notice notice-error">Leserechte konnten nicht gespeichert werden.</div>}

        <div className="permission-table-wrap">
          <table className="permission-table">
            <thead>
              <tr>
                <th>Gruppe</th>
                <th>Modus</th>
                {getAllCaseIds().map((caseId) => (
                  <th key={caseId}>Fall {caseId}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getAllCaseIds().map((groupId) => (
                <tr key={groupId}>
                  <th>Gruppe {groupId}</th>
                  <td>
                    <button
                      className={`group-mode-toggle ${permissions.groupModes?.[groupId] === "overview" ? "is-overview" : ""}`}
                      type="button"
                      onClick={() => toggleGroupMode(groupId)}
                    >
                      {permissions.groupModes?.[groupId] === "overview" ? "Übersicht" : "Schüler"}
                    </button>
                  </td>
                  {getAllCaseIds().map((caseId) => {
                    const checked = Boolean(permissions.matrix?.[groupId]?.[caseId]);

                    return (
                      <td key={caseId}>
                        <label className={`permission-cell ${checked ? "is-active" : ""}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(groupId, caseId)}
                          />
                          <span>{checked ? "frei" : "gesperrt"}</span>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function GroupChooser({ onChoose }) {
  return (
    <main className="chooser-screen">
      <section className="chooser-card">
        <p className="eyebrow">Internet-Kompass</p>
        <h1>Welche Gruppe seid ihr?</h1>
        <p className="chooser-text">
          Wählt eure Gruppe aus. Danach öffnet sich automatisch der passende Fall.
        </p>

        <div className="group-grid">
          {getAllCaseIds().map((id) => (
            <button key={id} className="group-button" onClick={() => onChoose(id)}>
              <strong>Gruppe {id}</strong>
              <span>{CASES[id].title}</span>
            </button>
          ))}
        </div>

        <button className="teacher-link-button" onClick={() => onChoose("0")}>
          Lehrerversion öffnen
        </button>

        <button className="teacher-link-button" onClick={() => onChoose("admin")}>
          Adminpanel öffnen
        </button>

        <p className="small-hint">
          Feste Links: <code>?gruppe=1</code>, <code>?gruppe=2</code>, <code>?gruppe=3</code>, <code>?gruppe=4</code>.
          Ergebnisse: <code>?gruppe=11</code>, <code>?gruppe=12</code>, <code>?gruppe=13</code>, <code>?gruppe=14</code>.
          Lehrerversion: <code>?gruppe=0</code>. Adminpanel: <code>?gruppe=admin</code>
        </p>
      </section>
    </main>
  );
}

function SharedCaseChat({ caseData, selectedMessages }) {
  const chatMessages = caseData.studentChat ?? caseData.fallbackChat ?? [];

  return (
    <div className="shared-case-chat">
      {chatMessages.map((message, index) => {
        const isSelected = isSharedMessageSelected(message, index, selectedMessages);

        return (
          <div
            key={`${message.sender}-${message.time}-${index}`}
            className={`shared-chat-message ${isSelected ? "is-selected" : ""}`}
          >
            <strong>{message.sender}</strong>
            <span>{message.text}</span>
          </div>
        );
      })}
    </div>
  );
}

function answerLabelForSharedQuestion(questionId) {
  if (questionId === "q2") return "Eigenschaften";
  if (questionId === "q3") return "Folgen";
  if (questionId === "q4") return "Handlung";
  if (questionId === "q5") return "Regel";
  return questionId;
}

function sharedAnswerEntries(answer) {
  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer : ["Noch keine Antwort gespeichert."];
  }

  if (answer && typeof answer === "object") {
    const rule = String(answer.rule ?? "").trim();
    const reason = String(answer.reason ?? "").trim();
    const entries = [];
    if (rule) entries.push(`Regel: ${rule}.`);
    if (reason) entries.push(`Begründung: ${reason}.`);
    return entries.length > 0 ? entries : ["Noch keine Antwort gespeichert."];
  }

  const text = String(answer ?? "").trim();
  return text ? [text] : ["Noch keine Antwort gespeichert."];
}

function ExtendedReadAccessPanel({ groupId }) {
  const [permissions, setPermissions] = useState(emptyPermissions);
  const [answerGroups, setAnswerGroups] = useState({});
  const [loadState, setLoadState] = useState("idle");

  async function loadSharedData() {
    setLoadState("loading");

    try {
      const [permissionsResponse, answersResponse] = await Promise.all([
        fetch(`/api/permissions?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/answers?t=${Date.now()}`, { cache: "no-store" })
      ]);

      if (!permissionsResponse.ok || !answersResponse.ok) {
        throw new Error("Freigegebene Ergebnisse konnten nicht geladen werden.");
      }

      const [permissionsResult, answersResult] = await Promise.all([
        permissionsResponse.json(),
        answersResponse.json()
      ]);

      setPermissions(normalizePermissions(permissionsResult.data));
      setAnswerGroups(normalizeAnswerGroups(answersResult.data?.groups));
      setLoadState("success");
    } catch (error) {
      console.warn("Freigegebene Ergebnisse konnten nicht geladen werden:", error);
      setLoadState("error");
    }
  }

  useEffect(() => {
    loadSharedData();
  }, [groupId]);

  const allowedCaseIds = getAllCaseIds().filter((caseId) => permissions.matrix?.[groupId]?.[caseId]);

  if (allowedCaseIds.length === 0 && loadState !== "error") {
    return null;
  }

  return (
    <section className="extended-access-panel">
      <div className="extended-access-header">
        <div>
          <p className="eyebrow">Freigegebene Ergebnisse</p>
          <h2>Erweiterte Leserechte</h2>
        </div>
        <button className="secondary-button" type="button" onClick={loadSharedData}>
          Aktualisieren
        </button>
      </div>

      {loadState === "error" && (
        <div className="notice notice-error">Freigegebene Ergebnisse konnten nicht geladen werden.</div>
      )}

      <div className="shared-case-list">
        {allowedCaseIds.map((caseId) => {
          const sharedCaseData = CASES[caseId];
          const savedGroup = answerGroups[caseId];
          const answers = normalizeAnswersForCase(sharedCaseData, savedGroup?.answers);
          const selectedMessages = Array.isArray(answers.q1) ? answers.q1 : [];

          return (
            <article className="shared-case-card" key={caseId}>
              <header>
                <p className="eyebrow">Fall {caseId}</p>
                <h3>{sharedCaseData.title}</h3>
              </header>

              <SharedCaseChat caseData={sharedCaseData} selectedMessages={selectedMessages} />

              <div className="shared-answer-grid">
                {["q2", "q3", "q4", "q5"].map((questionId) => (
                  <div className="shared-answer-card" key={questionId}>
                    <h4>{answerLabelForSharedQuestion(questionId)}</h4>
                    <ul>
                      {sharedAnswerEntries(answers[questionId]).map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StudentView({ groupId, onSwitchGroup }) {
  const caseData = getCaseById(groupId);
  const pages = useMemo(() => splitIntoPages(caseData.questions), [caseData]);
  const questionsById = useMemo(() => {
    return Object.fromEntries(caseData.questions.map((question) => [question.id, question]));
  }, [caseData.questions]);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasReadChat, setHasReadChat] = useState(false);
  const [answers, setAnswers] = useState(() => {
    const saved = safeRead(groupId);
    return normalizeAnswersForCase(caseData, saved?.answers);
  });
  const [savedAt, setSavedAt] = useState(() => {
    const saved = safeRead(groupId);
    return saved?.savedAt ?? null;
  });
  const [saveError, setSaveError] = useState(false);
  const [serverSaveState, setServerSaveState] = useState("idle");

  const normalizedAnswers = useMemo(() => normalizeAnswersForCase(caseData, answers), [answers, caseData]);
  const answeredCount = Object.values(normalizedAnswers).filter(isAnswerFilled).length;
  const totalCount = caseData.questions.length;
  const currentQuestion = pages[pageIndex]?.[0];
  const q1Question = caseData.questions.find((question) => question.id === "q1");
  const selectedQ1Messages = Array.isArray(normalizedAnswers.q1) ? normalizedAnswers.q1 : [];
  const isMessageSelectionEditable = hasReadChat && currentQuestion?.type === "message-select";
  const isMessageSelectionVisible = isMessageSelectionEditable || selectedQ1Messages.length > 0;

  useEffect(() => {
    const saved = safeRead(groupId);
    setAnswers(normalizeAnswersForCase(caseData, saved?.answers));
    setSavedAt(saved?.savedAt ?? null);
    setPageIndex(0);
    setHasReadChat(false);
    setSaveError(false);
    setServerSaveState("idle");
  }, [groupId, caseData]);

  useEffect(() => {
    const ok = safeWrite(groupId, {
      groupId,
      title: caseData.title,
      focus: caseData.focus,
      answers: normalizedAnswers,
      savedAt,
      lastEditedAt: new Date().toISOString(),
      finalSaveClicked: Boolean(savedAt)
    });

    setSaveError(!ok);
  }, [normalizedAnswers, caseData.title, caseData.focus, groupId, savedAt]);

  function markUnsaved() {
    if (savedAt) setSavedAt(null);
    if (serverSaveState !== "idle") setServerSaveState("idle");
  }

  function updateAnswer(questionId, value) {
    const question = questionsById[questionId];
    if (!question) return;

    setAnswers((current) => ({
      ...current,
      [questionId]: normalizeAnswerForQuestion(question, value)
    }));

    markUnsaved();
  }

  function toggleQ1Message(messageValue) {
    const maxSelections = q1Question?.maxSelections ?? 1;

    setAnswers((current) => {
      const selectedValues = normalizeArrayAnswer(current.q1, maxSelections);
      const safeMessageValue = String(messageValue ?? "").trim().slice(0, MAX_ARRAY_ANSWER_LENGTH);
      if (!safeMessageValue) return current;

      if (selectedValues.includes(safeMessageValue)) {
        return {
          ...current,
          q1: selectedValues.filter((entry) => entry !== safeMessageValue)
        };
      }

      if (selectedValues.length >= maxSelections) {
        return current;
      }

      return {
        ...current,
        q1: [...selectedValues, safeMessageValue]
      };
    });

    markUnsaved();
  }

  async function handleFinalSave() {
    const now = new Date().toISOString();
    const answersToSave = normalizeAnswersForCase(caseData, answers);

    const localPayload = {
      groupId,
      title: caseData.title,
      focus: caseData.focus,
      answers: answersToSave,
      savedAt: now,
      lastEditedAt: now,
      finalSaveClicked: true
    };

    const localOk = safeWrite(groupId, localPayload);
    setSaveError(!localOk);
    if (!localOk) return false;

    setSavedAt(now);
    setAnswers(answersToSave);
    setServerSaveState("saving");

    try {
      await postJson("/api/save", localPayload);
      setServerSaveState("server-success");
    } catch (error) {
      console.warn("Übertragung an Lehrerseite fehlgeschlagen:", error);
      setServerSaveState("server-error");
    }

    return true;
  }

  const currentPayload = {
    groupId,
    title: caseData.title,
    focus: caseData.focus,
    answers: normalizedAnswers,
    savedAt: savedAt || new Date().toISOString(),
    finalSaveClicked: Boolean(savedAt)
  };

  return (
    <main className="student-layout">
      <ChatPanel
        caseData={caseData}
        isMessageSelectionActive={isMessageSelectionVisible}
        isMessageSelectionEditable={isMessageSelectionEditable}
        selectedMessages={selectedQ1Messages}
        maxMessageSelections={q1Question?.maxSelections ?? 1}
        onToggleMessage={toggleQ1Message}
      />

      <QuestionSection
          caseData={caseData}
          pages={pages}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          hasReadChat={hasReadChat}
          setHasReadChat={setHasReadChat}
          answers={normalizedAnswers}
          updateAnswer={updateAnswer}
          answeredCount={answeredCount}
          totalCount={totalCount}
          handleFinalSave={handleFinalSave}
          saveError={saveError}
          serverSaveState={serverSaveState}
          currentPayload={currentPayload}
          onSwitchGroup={onSwitchGroup}
      />

    </main>
  );
}

function GroupModeRoute({ groupId, onSwitchGroup }) {
  const [routeState, setRouteState] = useState("loading");
  const [groupMode, setGroupMode] = useState("student");

  useEffect(() => {
    let isActive = true;

    async function loadGroupMode({ isInitialLoad = false } = {}) {
      if (isInitialLoad) {
        setRouteState("loading");
      }

      try {
        const response = await fetch(`/api/permissions?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Serverfehler ${response.status}`);
        const result = await response.json();
        const permissions = normalizePermissions(result.data);

        if (!isActive) return;
        setGroupMode(permissions.groupModes?.[groupId] === "overview" ? "overview" : "student");
        setRouteState("ready");
      } catch (error) {
        console.warn("Gruppenmodus konnte nicht geladen werden:", error);
        if (!isActive) return;
        if (isInitialLoad) {
          setGroupMode("student");
          setRouteState("ready");
        }
      }
    }

    loadGroupMode({ isInitialLoad: true });
    const intervalId = window.setInterval(() => {
      loadGroupMode();
    }, 4000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [groupId]);

  if (routeState === "loading") {
    return (
      <main className="mode-loading-screen">
        <div className="notice notice-neutral">Gruppenmodus wird geladen ...</div>
      </main>
    );
  }

  if (groupMode === "overview") {
    return <TeacherView viewerGroupId={groupId} />;
  }

  return <StudentView groupId={groupId} onSwitchGroup={onSwitchGroup} />;
}

export default function App() {
  const [groupId, setGroupId] = useState(getInitialGroupId);

  function chooseGroup(id) {
    const url = new URL(window.location.href);
    url.searchParams.set("gruppe", id);
    window.history.replaceState({}, "", url.toString());
    setGroupId(id);
  }

  function switchGroup() {
    const url = new URL(window.location.href);
    url.searchParams.delete("gruppe");
    window.history.replaceState({}, "", url.toString());
    setGroupId(null);
  }

  if (groupId === "0") {
    return <TeacherView />;
  }

  if (["11", "12", "13", "14"].includes(groupId)) {
    return <TeacherView viewerGroupId={String(Number(groupId) - 10)} />;
  }

  if (groupId === "admin") {
    return <AdminPanel />;
  }

  if (!groupId) {
    return <GroupChooser onChoose={chooseGroup} />;
  }

  return <GroupModeRoute groupId={groupId} onSwitchGroup={switchGroup} />;
}

