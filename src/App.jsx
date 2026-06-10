import React, { useEffect, useMemo, useState } from "react";
import { CASES, getAllCaseIds, getCaseById } from "./data/cases.js";
import ChatPanel from "./components/chat/ChatPanel.jsx";
import QuestionSection from "./components/student/QuestionSection.jsx";
import TeacherView from "./components/teacher/TeacherView.jsx";

const APP_VERSION = "student-v2";
const QUESTIONS_PER_PAGE = 1;
const ARRAY_ANSWER_TYPES = new Set(["message-select", "property-select"]);
const MAX_TEXT_ANSWER_LENGTH = 2500;
const MAX_ARRAY_ANSWER_LENGTH = 250;


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
  if (ARRAY_ANSWER_TYPES.has(question.type)) {
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
    return normalizeArrayAnswer(value, question.maxSelections ?? 2);
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
  const isLastPage = pageIndex === pages.length;
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
    if (!localOk) return;

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

  if (!groupId) {
    return <GroupChooser onChoose={chooseGroup} />;
  }

  return <StudentView groupId={groupId} onSwitchGroup={switchGroup} />;
}

