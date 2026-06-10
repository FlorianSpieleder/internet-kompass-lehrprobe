import { useMemo, useState } from "react";

const STEP_LABELS = [
    "Knackpunkt",
    "Eigenschaften",
    "Folgen",
    "Handlung"
];

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
        <div className="step-progress">
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

function getMessageValue(message, index) {
    return `${index + 1}. ${message.sender} (${message.time}): ${message.text}`;
}

function MessageSelectQuestion({ question, caseData, value, onChange }) {
    const selectedValues = Array.isArray(value) ? value : [];
    const maxSelections = question.maxSelections ?? 1;

    function toggleMessage(messageValue) {
        if (selectedValues.includes(messageValue)) {
            onChange(question.id, selectedValues.filter((entry) => entry !== messageValue));
            return;
        }

        if (selectedValues.length >= maxSelections) {
            return;
        }

        onChange(question.id, [...selectedValues, messageValue]);
    }

    return (
        <article className="question-card">
            <h2>{question.label}</h2>
            <p>{question.helper}</p>

            <div className="message-select-list">
                {caseData.fallbackChat.map((message, index) => {
                    const messageValue = getMessageValue(message, index);
                    const isSelected = selectedValues.includes(messageValue);
                    const isDisabled = !isSelected && selectedValues.length >= maxSelections;

                    return (
                        <button
                            key={`${message.sender}-${message.time}-${index}`}
                            type="button"
                            className={`message-select-item ${isSelected ? "is-selected" : ""}`}
                            disabled={isDisabled}
                            onClick={() => toggleMessage(messageValue)}
                        >
                            <span className="message-select-meta">
                                {message.sender} · {message.time}
                            </span>
                            <span className="message-select-text">
                                {message.text}
                            </span>
                        </button>
                    );
                })}
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
                caseData={caseData}
                value={value}
                onChange={onChange}
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

function SavedNotice({ savedAt, saveError, serverSaveState }) {
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

    if (serverSaveState === "server-success") {
        return (
            <div className="notice notice-success">
                Gespeichert und an die Lehrerseite übertragen um {formatTime(savedAt)}.
            </div>
        );
    }

    if (!savedAt) return null;

    return (
        <div className="notice notice-success">
            Lokal gespeichert um {formatTime(savedAt)}.
        </div>
    );
}

function EmergencyCodeBox({ payload }) {
    const [isOpen, setIsOpen] = useState(false);
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
            <button
                className="emergency-toggle"
                type="button"
                onClick={() => setIsOpen((current) => !current)}
            >
                Technische Hilfe
            </button>

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
                                            answers,
                                            updateAnswer,
                                            isLastPage,
                                            handleFinalSave,
                                            savedAt,
                                            saveError,
                                            serverSaveState,
                                            currentPayload
                                        }) {
    const [hasReadChat, setHasReadChat] = useState(false);

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
                pageCount={pages.length}
            />

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

            <footer className="navigation">
                <button
                    className="secondary-button"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
                >
                    Zurück
                </button>

                {!isLastPage ? (
                    <button
                        className="primary-button"
                        onClick={() => setPageIndex((current) => Math.min(current + 1, pages.length - 1))}
                    >
                        Weiter
                    </button>
                ) : (
                    <button className="save-button" onClick={handleFinalSave}>
                        Antworten speichern
                    </button>
                )}
            </footer>

            <SavedNotice savedAt={savedAt} saveError={saveError} serverSaveState={serverSaveState} />

            <EmergencyCodeBox payload={currentPayload} />
        </section>
    );
}