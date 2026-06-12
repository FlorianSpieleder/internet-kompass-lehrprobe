import { useEffect, useMemo, useRef, useState } from "react";

const STEP_LABELS = [
    "Knackpunkt",
    "Eigenschaften",
    "Folgen",
    "Handlung",
    "Regel",
    "Check",
];

const DEFAULT_RULE_PART_MAX_LENGTH = 90;

function progressIndexForPage(pageIndex, isOverviewPage) {
    if (isOverviewPage) {
        return STEP_LABELS.length;
    }

    if (pageIndex >= 5) {
        return 5;
    }

    return pageIndex;
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

    if (value && typeof value === "object") {
        const rule = String(value.rule ?? "").trim();
        const reason = String(value.reason ?? "").trim();
        const entries = [];

        if (rule) {
            entries.push(`Regel: ${rule}.`);
        }

        if (reason) {
            entries.push(`Begründung: ${reason}.`);
        }

        return entries;
    }

    const text = String(value ?? "").trim();
    return text ? [text] : [];
}

function formatRuleSentence(value) {
    const entries = answerAsList(value);
    return entries.length > 0 ? entries.join("\n") : "Noch keine Regel formuliert.";
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
    const summaryQuestions = caseData.questions
        .map((question, index) => ({ question, index }))
        .filter(({ question }) => ["q2", "q3", "q4", "q5"].includes(question.id));

    return (
        <article className="student-summary">
            <div className="student-summary-rule-notice">
                Schreibt nun eure fertige Regel auf das Regelblatt.
            </div>

            <div className="student-summary-grid">
                {summaryQuestions.map(({ question, index }) => (
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

function QuestionLabel({ question }) {
    if (question.labelParts?.name) {
        return (
            <>
                {question.labelParts.beforeName}
                <span className="question-highlight-name">{question.labelParts.name}</span>
                {question.labelParts.afterName}
            </>
        );
    }

    return question.label;
}

function TextQuestion({ question, value, onChange }) {
    return (
        <article className="question-card">
            <label htmlFor={question.id}>
                <QuestionLabel question={question} />
            </label>
            <p>{question.helper}</p>
            {Array.isArray(question.criteria) && question.criteria.length > 0 && (
                <div className="rule-criteria">
                    <strong>{question.criteriaTitle ?? "Achtet darauf:"}</strong>
                    <ul>
                        {question.criteria.map((criterion) => (
                            <li key={criterion}>{criterion}</li>
                        ))}
                    </ul>
                </div>
            )}
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

function InlineEditableField({ value, onChange, placeholder, ariaLabel, maxLength }) {
    const fieldRef = useRef(null);

    useEffect(() => {
        const field = fieldRef.current;
        if (!field || document.activeElement === field) return;

        if (field.textContent !== value) {
            field.textContent = value;
        }
    }, [value]);

    function handlePaste(event) {
        event.preventDefault();
        const currentText = event.currentTarget.textContent ?? "";
        const remainingLength = Math.max(0, maxLength - currentText.length);
        const text = event.clipboardData.getData("text/plain").slice(0, remainingLength);
        document.execCommand("insertText", false, text);
    }

    function handleInput(event) {
        const nextValue = (event.currentTarget.textContent ?? "").slice(0, maxLength);

        if (event.currentTarget.textContent !== nextValue) {
            event.currentTarget.textContent = nextValue;
            const range = document.createRange();
            range.selectNodeContents(event.currentTarget);
            range.collapse(false);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
        }

        onChange(nextValue);
    }

    return (
        <span
            ref={fieldRef}
            className="rule-sentence-field"
            contentEditable
            role="textbox"
            tabIndex={0}
            aria-label={ariaLabel}
            aria-multiline="false"
            data-placeholder={placeholder}
            suppressContentEditableWarning
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                }
            }}
        />
    );
}

function RuleSentenceFields({ value, maxLength = DEFAULT_RULE_PART_MAX_LENGTH, onChange }) {
    const ruleValue = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const rule = typeof ruleValue.rule === "string" ? ruleValue.rule : "";
    const reason = typeof ruleValue.reason === "string" ? ruleValue.reason : "";

    function updateField(field, fieldValue) {
        onChange({
            rule,
            reason,
            [field]: fieldValue
        });
    }

    return (
        <div className="rule-sentence-fields">
            <div className="rule-sentence-row">
                <span>Regel</span>
                <InlineEditableField
                    value={rule}
                    onChange={(nextValue) => updateField("rule", nextValue)}
                    placeholder="wir ..."
                    ariaLabel="Regel vervollständigen"
                    maxLength={maxLength}
                />
                <small>{rule.length}/{maxLength}</small>
            </div>

            <div className="rule-sentence-row">
                <span>Begründung</span>
                <InlineEditableField
                    value={reason}
                    onChange={(nextValue) => updateField("reason", nextValue)}
                    placeholder="..."
                    ariaLabel="Begründung vervollständigen"
                    maxLength={maxLength}
                />
                <small>{reason.length}/{maxLength}</small>
            </div>
        </div>
    );
}

function RuleSentenceQuestion({ question, value, onChange }) {
    return (
        <article className="question-card">
            <h2>{question.label}</h2>
            <p>{question.helper}</p>
            <RuleSentenceFields
                value={value}
                maxLength={question.maxLength ?? DEFAULT_RULE_PART_MAX_LENGTH}
                onChange={(nextValue) => onChange(question.id, nextValue)}
            />
        </article>
    );
}

function ChecklistQuestion({ question, value, ruleValue, onChange }) {
    const selectedValues = Array.isArray(value) ? value : [];

    function toggleOption(option) {
        if (selectedValues.includes(option)) {
            onChange(question.id, selectedValues.filter((entry) => entry !== option));
            return;
        }

        onChange(question.id, [...selectedValues, option]);
    }

    return (
        <article className="question-card checklist-card">
            <h2>{question.label}</h2>
            <p>{question.helper}</p>

            <div className="rule-review-editor">
                <strong>Eure Regel</strong>
                <p>{formatRuleSentence(ruleValue)}</p>
            </div>

            <div className="checklist-options">
                {question.options.map((option) => {
                    const isSelected = selectedValues.includes(option);

                    return (
                        <label
                            key={option}
                            className={`checklist-option ${isSelected ? "is-selected" : ""}`}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleOption(option)}
                            />
                            <span>{option}</span>
                        </label>
                    );
                })}
            </div>
        </article>
    );
}

function QuestionRenderer({ question, caseData, value, answers, onChange }) {
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

    if (question.type === "checklist") {
        return (
            <ChecklistQuestion
                question={question}
                value={value}
                ruleValue={answers.q5}
                onChange={onChange}
            />
        );
    }

    if (question.type === "rule-sentence") {
        return (
            <RuleSentenceQuestion
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
                                            handleFinalSave,
                                            saveError,
                                            serverSaveState,
                                        currentPayload
                                    }) {
    const pageCount = pages.length + 1;
    const isOverviewPage = pageIndex === pages.length;
    const isLastQuestionPage = pageIndex === pages.length - 1;
    const progressIndex = progressIndexForPage(pageIndex, isOverviewPage);
    const isSaving = serverSaveState === "saving";
    const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

    async function handleNext() {
        if (isLastQuestionPage) {
            const didSave = await handleFinalSave();
            if (!didSave) return;
        }

        setPageIndex((current) => Math.min(current + 1, pageCount - 1));
    }

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
                pageIndex={progressIndex}
                pageCount={STEP_LABELS.length}
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
                            answers={answers}
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

                {!isOverviewPage && (
                    <button
                        className="primary-button"
                        onClick={handleNext}
                        disabled={isSaving}
                    >
                        {isSaving ? "Speichert ..." : "Weiter"}
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
