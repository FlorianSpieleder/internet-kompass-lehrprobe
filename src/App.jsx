import React, { useEffect, useMemo, useState } from "react";
import { CASES, getAllCaseIds, getCaseById } from "./data/cases.js";
import ChatPanel from "./components/chat/ChatPanel.jsx";
import QuestionSection from "./components/student/QuestionSection.jsx";
import ReadChatStart from "./components/student/ReadChatStart.jsx";

const APP_VERSION = "student-v2";
const QUESTIONS_PER_PAGE = 1;

const ENTRY_CASE = {
  groupName: "Einstieg",
  title: "Privater Screenshot im Klassenchat",
  focus: "Private Inhalte nur mit Erlaubnis teilen",
  q1: "Ein privater Chat/Screenshot wird in den Klassenchat gestellt.",
  q2: "Speicherung, Screenshot/Weitergabe, größerer Empfängerkreis, Kontextverlust, Kontrollverlust.",
  q3: "Private Unsicherheit wird offengelegt; Tom verliert Kontrolle über die Information; Vertrauen kann beschädigt werden.",
  q4: "Screenshot löschen, entschuldigen, privat klären und private Inhalte künftig nur mit Erlaubnis teilen."};

function getInitialGroupId() {
  const params = new URLSearchParams(window.location.search);
  const groupFromUrl = params.get("gruppe") || params.get("fall") || params.get("t");

  if (groupFromUrl === "0" || groupFromUrl === "lehrer") return "0";
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
  if (question.type === "message-select" || question.type === "property-select") {
    return [];
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

  return String(answer ?? "").trim().length > 0;
}

function splitIntoPages(questions) {
  const pages = [];
  for (let i = 0; i < questions.length; i += QUESTIONS_PER_PAGE) {
    pages.push(questions.slice(i, i + QUESTIONS_PER_PAGE));
  }
  return pages;
}

function formatTime(isoString) {
  if (!isoString) return "–";
  try {
    return new Date(isoString).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "–";
  }
}

function answerText(savedGroup, questionId) {
  const answer = savedGroup?.answers?.[questionId];

  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer.join("\n") : "Noch keine Antwort gespeichert.";
  }

  return String(answer ?? "").trim() || "Noch keine Antwort gespeichert.";
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
  const payload = JSON.parse(json);

  const groupId = String(payload.groupId ?? "");
  if (!["1", "2", "3", "4"].includes(groupId)) {
    throw new Error("Der Code enthält keine gültige Gruppe.");
  }

  const answers = {};
  for (const questionId of ["q1", "q2", "q3", "q4"]) {
    const rawAnswer = payload.answers?.[questionId];

    if (Array.isArray(rawAnswer)) {
      answers[questionId] = rawAnswer.map((entry) => String(entry));
    } else {
      answers[questionId] = String(rawAnswer ?? "");
    }
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
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTeacherImports(groups) {
  try {
    window.localStorage.setItem(teacherImportStorageKey(), JSON.stringify(groups));
  } catch (error) {
    console.warn("Manuelle Importe konnten nicht lokal gespeichert werden:", error);
  }
}

function mergeGroups(serverGroups, importedGroups) {
  return {
    ...(serverGroups ?? {}),
    ...(importedGroups ?? {})
  };
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

        <p className="small-hint">
          Feste Links: <code>?gruppe=1</code>, <code>?gruppe=2</code>, <code>?gruppe=3</code>, <code>?gruppe=4</code>.
          Lehrerversion: <code>?gruppe=0</code>
        </p>
      </section>
    </main>
  );
}

function StudentView({ groupId, onSwitchGroup }) {
  const caseData = getCaseById(groupId);
  const pages = useMemo(() => splitIntoPages(caseData.questions), [caseData]);
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const saved = safeRead(groupId);
    return saved?.answers ?? emptyAnswersFor(caseData);
  });
  const [savedAt, setSavedAt] = useState(() => {
    const saved = safeRead(groupId);
    return saved?.savedAt ?? null;
  });
  const [saveError, setSaveError] = useState(false);
  const [serverSaveState, setServerSaveState] = useState("idle");

  const answeredCount = Object.values(answers).filter(isAnswerFilled).length;const totalCount = caseData.questions.length;
  const isLastPage = pageIndex === pages.length - 1;

  useEffect(() => {
    const saved = safeRead(groupId);
    setAnswers(saved?.answers ?? emptyAnswersFor(caseData));
    setSavedAt(saved?.savedAt ?? null);
    setPageIndex(0);
    setSaveError(false);
    setServerSaveState("idle");
  }, [groupId, caseData]);

  useEffect(() => {
    const ok = safeWrite(groupId, {
      groupId,
      title: caseData.title,
      focus: caseData.focus,
      answers,
      savedAt,
      lastEditedAt: new Date().toISOString(),
      finalSaveClicked: Boolean(savedAt)
    });

    setSaveError(!ok);
  }, [answers, caseData.title, caseData.focus, groupId, savedAt]);

  function updateAnswer(questionId, value) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value
    }));

    if (savedAt) setSavedAt(null);
    if (serverSaveState !== "idle") setServerSaveState("idle");
  }

  async function handleFinalSave() {
    const now = new Date().toISOString();

    const localPayload = {
      groupId,
      title: caseData.title,
      focus: caseData.focus,
      answers,
      savedAt: now,
      lastEditedAt: now,
      finalSaveClicked: true
    };

    const localOk = safeWrite(groupId, localPayload);
    setSaveError(!localOk);
    if (!localOk) return;

    setSavedAt(now);
    setServerSaveState("saving");

    try {
      await postJson("/api/save", localPayload);
      setServerSaveState("server-success");
    } catch (error) {
      console.warn("Übertragung an Lehrerseite fehlgeschlagen:", error);
      setServerSaveState("server-error");
    }
  }

  const currentPayload = {
    groupId,
    title: caseData.title,
    focus: caseData.focus,
    answers,
    savedAt: savedAt || new Date().toISOString(),
    finalSaveClicked: Boolean(savedAt)
  };

  return (
    <main className="student-layout">
      <ChatPanel caseData={caseData} />

      <QuestionSection
          caseData={caseData}
          pages={pages}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          answers={answers}
          updateAnswer={updateAnswer}
          answeredCount={answeredCount}
          totalCount={totalCount}
          isLastPage={isLastPage}
          handleFinalSave={handleFinalSave}
          savedAt={savedAt}
          saveError={saveError}
          serverSaveState={serverSaveState}
          currentPayload={currentPayload}
          onSwitchGroup={onSwitchGroup}
      />
    </main>
  );
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

      // Best effort: Wenn die Netlify-Funktion erreichbar ist,
      // wird der manuelle Import zusätzlich in Blobs gespeichert.
      // Wenn nicht, bleibt er trotzdem lokal auf der Lehrerseite sichtbar.
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
          ? Object.values(savedGroup.answers ?? {}).filter((answer) => String(answer).trim().length > 0).length
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
            <p>{answeredCount}/{caseData.questions.length} Antworten · zuletzt: {formatTime(savedGroup?.receivedAt || savedGroup?.savedAt)}</p>
          </button>
        );
      })}
    </div>
  );
}

function GroupPresentationCard({ groupId, answersData }) {
  const caseData = CASES[groupId];
  const savedGroup = answersData.groups?.[groupId];

  if (!caseData) return null;

  return (
    <section className="presentation-card">
      <div className="presentation-header">
        <div>
          <p className="eyebrow">Lernkarte für die Vorstellung</p>
          <h2>{caseData.groupName}: {caseData.title}</h2>
          <p>{caseData.focus}</p>
        </div>
        <div className={`big-status ${savedGroup ? "status-saved" : "status-missing"}`}>
          {savedGroup?.importedManually ? "importiert" : savedGroup ? "gespeichert" : "noch offen"}
        </div>
      </div>

      <div className="answer-card-grid">
        {caseData.questions.map((question) => (
          <article className="answer-card" key={question.id}>
            <h4>{question.label}</h4>
            <p>{answerText(savedGroup, question.id)}</p>
          </article>
        ))}
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

function TeacherView({ onSwitchGroup }) {
  const [answersData, setAnswersData] = useState(() => ({
    groups: readTeacherImports(),
    updatedAt: null
  }));
  const [selectedGroupId, setSelectedGroupId] = useState("1");
  const [mode, setMode] = useState("cards");
  const [showImport, setShowImport] = useState(false);
  const [loadState, setLoadState] = useState("idle");

  async function loadAnswers() {
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
    const confirmed = window.confirm("Wirklich alle gespeicherten Gruppenantworten für diese Stunde löschen?");
    if (!confirmed) return;

    setLoadState("loading");
    try {
      const result = await postJson("/api/reset", {});
      writeTeacherImports({});
      setAnswersData(result.data ?? { groups: {}, updatedAt: null });
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
      [importedGroup.groupId]: importedGroup
    };

    writeTeacherImports(nextImports);

    setAnswersData((current) => ({
      ...current,
      groups: {
        ...(current.groups ?? {}),
        [importedGroup.groupId]: importedGroup
      },
      updatedAt: importedGroup.importedAt || new Date().toISOString()
    }));

    setSelectedGroupId(importedGroup.groupId);
    setMode("cards");
  }

  useEffect(() => {
    loadAnswers();
  }, []);

  const savedCount = getAllCaseIds().filter((id) => answersData.groups?.[id]).length;

  return (
    <main className="teacher-layout">
      <header className="teacher-header">
        <div>
          <p className="eyebrow">Lehrerversion</p>
          <h1>Internet-Kompass: Gruppenübersicht</h1>
          <p>
            {savedCount}/4 Gruppen gespeichert · zuletzt geladen:{" "}
            {loadState === "success" ? formatTime(new Date().toISOString()) : "–"}
          </p>
        </div>

        <div className="teacher-actions">
          <button className="primary-button" onClick={loadAnswers}>
            Antworten aktualisieren
          </button>
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
            Tabellenübersicht
          </button>
          <button
            className={`secondary-button ${showImport ? "is-active" : ""}`}
            onClick={() => setShowImport((current) => !current)}
          >
            Import
          </button>
          <button className="danger-button" onClick={resetAnswers}>
            Stunde zurücksetzen
          </button>
          <button className="ghost-button" onClick={onSwitchGroup}>
            Schülerversion
          </button>
        </div>
      </header>

      {loadState === "loading" && <div className="notice notice-neutral">Antworten werden geladen …</div>}
      {loadState === "error" && (
        <div className="notice notice-error">
          Die automatische Synchronisation ist gerade nicht erreichbar. Du kannst trotzdem Antwortcodes manuell importieren.
        </div>
      )}

      {showImport && <TeacherImportPanel onImport={handleManualImport} />}

      {mode === "cards" ? (
        <>
          <TeacherStatusCards
            answersData={answersData}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />
          <GroupPresentationCard groupId={selectedGroupId} answersData={answersData} />
        </>
      ) : (
        <CompactOverviewTable answersData={answersData} />
      )}
    </main>
  );
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
    return <TeacherView onSwitchGroup={switchGroup} />;
  }

  if (!groupId) {
    return <GroupChooser onChoose={chooseGroup} />;
  }

  return <StudentView groupId={groupId} onSwitchGroup={switchGroup} />;
}
