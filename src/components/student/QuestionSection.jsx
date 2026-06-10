import { useMemo, useState } from "react";

const STEP_LABELS = [
    "Knackpunkt",
    "Eigenschaften",
    "Folgen",
    "Handlung",
    "Übersicht"
];

function encodeAnswerCode(payload) {
    const cleanPayload = {
        groupId: String(payload.groupId ?? ""),
        title: String(payload.title ?? ""),
        focus: String(payload.focus ?? ""),
        answers: payload.answers ?? {},
        savedAt: payload.savedAt || new Date().toISOString(),
        manualCodeVersion: 1
    };

    const json = JSON.stringify(cleanPayload);
    const bytes = new TextEncoder().encode(json);
    let binary = "";

    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return `IK1.${btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}`;
}

function Progress({ pageIndex, pageCount }) {
    return (
        <div className="step-progress" style={{ "--step-count": pageCount, "--step-half-count": pageCount * 2 }}>
            <div className="step-progress-line" aria-hidden="true" />

            {Array.from({ length: pageCount }).map((_, index) => {
                const isActive = index === pageIndex;
                const isDone = index < pageIndex;

                return (
                    <div
                        key={index}
                        className={`step-progress-item ${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
                    >
                        <div className="step-label">
                            {STEP_LABELS[index] ?? `Schritt ${index + 1}`}
                        </div>
                        <div className="step-dot">
                            {isDone ? "✓" : ""}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function MessageSelectQuestion({ question, value }) {
    const selectedValues = Array.isArray(value) ? value : [];
    const maxSelections = question.maxSelections ?? 1;

    return (
        <article className="question-card">
            <h2>{question.label}</h2>
            <p>
                Klickt die passende Nachricht direkt links im Chat an. Ihr könnt höchstens {maxSelections} Nachrichten auswählen.
            </p>

            <div className="message-selection-summary">
                {selectedValues.length > 0 ? (
                    <ol className="selected-message-list">
                        {selectedValues.map((messageValue) => (
                            <li key={messageValue}>{messageValue}</li>
                        ))}
                    </ol>
                ) : (
                    <p className="empty-selection-hint">
                        Noch keine Nachricht ausgewählt.
                    </p>
                )}
            </div>
        </article>
    );
}

function answerAsList(value) {
    if (Array.isArray(value)) {
        return value;
    }

    const text = String(value ?? "").trim();
    return text ? [text] : [];
}

function PresentationAnswer({ question, value, index }) {
    const entries = answerAsList(value);

    return (
        <article className="student-summary-card">
            <div className="student-summary-card-header">
                <span className="student-summary-number">{index + 1}</span>
                <h3>{question.label}</h3>
            </div>

            {entries.length > 0 ? (
                <ul>
                    {entries.map((entry) => (
                        <li key={entry}>{entry}</li>
                    ))}
                </ul>
            ) : (
                <p>Noch keine Antwort.</p>
            )}
        </article>
    );
}

function StudentPresentationOverview({ caseData, answers }) {
    return (
        <article className="student-summary">
            <div className="student-summary-grid">
                {caseData.questions.map((question, index) => (
                    <PresentationAnswer
                        key={question.id}
                        question={question}
                        index={index}
                        value={answers[question.id]}
                    />
                ))}
            </div>
        </article>
    );
}

function PropertySelectQuestion({ question, value, onChange }) {
    const selectedValues = Array.isArray(value) ? value : [];
    const maxSelections = question.maxSelections ?? 2;

    function toggleOption(option) {
        if (selectedValues.includes(option)) {
            onChange(question.id, selectedValues.filter((entry) => entry !== option));
            return;
        }

        if (selectedValues.length >= maxSelections) {
            return;
        }

        onChange(question.id, [...selectedValues, option]);
    }

    return (
        <article className="question-card">
            <h2>{question.label}</h2>
            <p>{question.helper}</p>

            <div className="property-options">
                {question.options.map((option) => {
                    const isSelected = selectedValues.includes(option);
                    const isDisabled = !isSelected && selectedValues.length >= maxSelections;

                    return (
                        <button
                            key={option}
                            type="button"
                            className={`property-option ${isSelected ? "is-selected" : ""}`}
                            disabled={isDisabled}
                            onClick={() => toggleOption(option)}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </article>
    );
}

function TextQuestion({ question, value, onChange }) {
    return (
        <article className="question-card">
            <label htmlFor={question.id}>{question.label}</label>
            <p>{question.helper}</p>
            <textarea
                id={question.id}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => onChange(question.id, event.target.value)}
                placeholder={question.placeholder}
                rows={5}
            />
        </article>
    );
}

function QuestionRenderer({ question, caseData, value, onChange }) {
    if (question.type === "message-select") {
        return (
            <MessageSelectQuestion
                question={question}
                value={value}
            />
        );
    }

    if (question.type === "property-select") {
        return (
            <PropertySelectQuestion
                question={question}
                value={value}
                onChange={onChange}
            />
        );
    }

    return (
        <TextQuestion
            question={question}
            value={value}
            onChange={onChange}
        />
    );
}

function SavedNotice({ saveError, serverSaveState }) {
    if (saveError) {
        return (
            <div className="notice notice-error">
                Die Antworten konnten nicht im Browser gespeichert werden. Bitte ruft die Lehrkraft.
            </div>
        );
    }

    if (serverSaveState === "saving") {
        return <div className="notice notice-neutral">Antworten werden an die Lehrerseite gesendet …</div>;
    }

    if (serverSaveState === "server-error") {
        return (
            <div className="notice notice-error">
                Lokal gespeichert, aber nicht an die Lehrerseite übertragen. Bitte noch einmal auf „Antworten speichern“ klicken oder die Lehrkraft rufen.
            </div>
        );
    }

    return null;
}

function EmergencyCodeBox({ payload, isOpen }) {
    const [showCode, setShowCode] = useState(false);
    const [copyState, setCopyState] = useState("idle");
    const code = useMemo(() => encodeAnswerCode(payload), [payload]);

    async function copyCode() {
        setCopyState("idle");

        try {
            await navigator.clipboard.writeText(code);
            setCopyState("success");
        } catch {
            setCopyState("error");
            setShowCode(true);
        }
    }

    return (
        <section className="emergency-menu">
            {isOpen && (
                <div className="emergency-panel">
                    <p>
                        Nur falls die Übertragung nicht funktioniert: Antwortcode anzeigen oder kopieren
                        und der Lehrkraft geben.
                    </p>

                    <div className="emergency-actions">
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => setShowCode((current) => !current)}
                        >
                            {showCode ? "Antwortcode ausblenden" : "Antwortcode anzeigen"}
                        </button>

                        <button
                            className="secondary-button"
                            type="button"
                            onClick={copyCode}
                        >
                            Antwortcode kopieren
                        </button>
                    </div>

                    {copyState === "success" && (
                        <p className="mini-success">Antwortcode wurde kopiert.</p>
                    )}

                    {copyState === "error" && (
                        <p className="mini-error">
                            Automatisches Kopieren war nicht möglich. Bitte den Code unten markieren und kopieren.
                        </p>
                    )}

                    {showCode && (
                        <textarea
                            className="answer-code-textarea"
                            readOnly
                            value={code}
                            aria-label="Antwortcode für die Lehrkraft"
                            onFocus={(event) => event.target.select()}
                            rows={4}
                        />
                    )}
                </div>
            )}
        </section>
    );
}

export default function QuestionSection({
                                            caseData,
                                            pages,
                                            pageIndex,
                                            setPageIndex,
                                            hasReadChat,
                                            setHasReadChat,
                                            answers,
                                            updateAnswer,
                                            isLastPage,
                                            handleFinalSave,
                                            savedAt,
                                            saveError,
                                            serverSaveState,
                                        currentPayload
                                    }) {
    const pageCount = pages.length + 1;
    const isOverviewPage = pageIndex === pages.length;
    const isSaveSuccess = serverSaveState === "server-success" || Boolean(savedAt);
    const isSaving = serverSaveState === "saving";
    const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

    if (!hasReadChat) {
        return (
            <section className="work-panel read-chat-panel">
                <button
                    className="read-chat-button"
                    type="button"
                    onClick={() => {
                        setHasReadChat(true);
                        setPageIndex(0);
                    }}
                >
                    Wir haben den Chat gelesen
                </button>
            </section>
        );
    }

    return (
        <section className="work-panel">
            <header className="work-header">
                <div>
                    <h1>{caseData.groupName}: {caseData.title}</h1>
                </div>
            </header>

            <Progress
                pageIndex={pageIndex}
                pageCount={pageCount}
            />

            {isOverviewPage ? (
                <StudentPresentationOverview
                    caseData={caseData}
                    answers={answers}
                />
            ) : (
                <div className="questions">
                    {pages[pageIndex].map((question) => (
                        <QuestionRenderer
                            key={question.id}
                            question={question}
                            caseData={caseData}
                            value={answers[question.id]}
                            onChange={updateAnswer}
                        />
                    ))}
                </div>
            )}

            <footer className="navigation">
                <button
                    className="secondary-button"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
                >
                    Zurück
                </button>

                <button
                    className="ghost-button navigation-help-button"
                    type="button"
                    onClick={() => setIsEmergencyOpen((current) => !current)}
                >
                    Technische Hilfe
                </button>

                {!isLastPage ? (
                    <button
                        className="primary-button"
                        onClick={() => setPageIndex((current) => Math.min(current + 1, pageCount - 1))}
                    >
                        Weiter
                    </button>
                ) : (
                    <button
                        className={`save-button ${isSaveSuccess ? "is-saved" : ""}`}
                        onClick={handleFinalSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Speichert ..." : isSaveSuccess ? "Gespeichert" : "Antworten speichern"}
                    </button>
                )}
            </footer>

            <SavedNotice saveError={saveError} serverSaveState={serverSaveState} />

            <EmergencyCodeBox
                payload={currentPayload}
                isOpen={isEmergencyOpen}
            />
        </section>
    );
}
