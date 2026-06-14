import { useState } from "react";
import "./ChatPanel.css";

const GROUP_AVATAR_SRC = "/chatbilder/klassenchat-7b-avatar.svg";

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

function getMessageValue(message, index) {
    return `${index + 1}. ${message.sender} (${message.time}): ${message.text}`;
}

function WhatsAppMessage({
                             message,
                             index,
                             isSelectionActive,
                             isSelectionEditable,
                             selectedMessages,
                             maxSelections,
                             onToggleMessage
                         }) {
    const lowerText = String(message.text || "").toLowerCase();
    const messageValue = getMessageValue(message, index);
    const isSelected = selectedMessages.includes(messageValue);
    const isDisabled = isSelectionEditable && !isSelected && selectedMessages.length >= maxSelections;
    const selectedClassName = isSelected
        ? isSelectionEditable
            ? "is-selected-editable"
            : "is-selected-readonly"
        : "";

    const isSystemMessage =
        lowerText.includes("bild wurde gesendet") ||
        lowerText.includes("screenshot wurde gesendet");

    if (isSystemMessage) {
        const systemMessage = (
            <div className={`wa-system-message ${selectedClassName}`}>
                {message.text}

                {isSelectionEditable && isSelected && (
                    <span className="wa-system-selected-badge" aria-hidden="true">
                        ✓
                    </span>
                )}
            </div>
        );

        if (!isSelectionEditable) {
            return (
                <div className="wa-system-message-frame">
                    {systemMessage}
                </div>
            );
        }

        return (
            <button
                type="button"
                className={`wa-system-message-frame wa-selectable-system-message ${isSelected ? "is-selected-editable" : ""}`}
                disabled={isDisabled}
                onClick={() => onToggleMessage(messageValue)}
            >
                {systemMessage}
            </button>
        );
    }

    const messageContent = (
        <div className={`wa-message-row ${isSelectionEditable ? "is-editable" : ""}`}>
            <div className={`wa-avatar ${getAvatarClass(message.sender)}`}>
                {getInitials(message.sender)}
            </div>

            <div className={`wa-bubble ${selectedClassName}`}>
                <div className="wa-sender">{message.sender}</div>
                <div className="wa-text">{message.text}</div>

                <div className="wa-meta-row">
                    <span className="wa-time">{message.time}</span>
                    <span className="wa-checks" aria-hidden="true">
            ✓✓
          </span>
                </div>

                {isSelectionEditable && isSelected && (
                    <div className="wa-selected-badge" aria-hidden="true">
                        ✓
                    </div>
                )}
            </div>
        </div>
    );

    if (!isSelectionEditable) {
        return (
            <div className="wa-message-frame">
                {messageContent}
            </div>
        );
    }

    return (
        <button
            type="button"
            className={`wa-message-frame wa-selectable-message ${isSelected ? "is-selected-editable" : ""}`}
            disabled={isDisabled}
            onClick={() => onToggleMessage(messageValue)}
        >
            {messageContent}
        </button>
    );
}

export default function ChatPanel({
                                      caseData,
                                      isMessageSelectionActive = false,
                                      isMessageSelectionEditable = false,
                                      selectedMessages = [],
                                      maxMessageSelections = 2,
                                      onToggleMessage = () => {}
                                  }) {
    const [groupImageFailed, setGroupImageFailed] = useState(false);

    return (
        <aside className="chat-panel">
            <div className="sticky-chat">
                <div className={`wa-phone ${isMessageSelectionActive ? "is-selecting" : ""}`}>
                    <header className="wa-header">
                        <div className="wa-back-arrow" aria-hidden="true">
                            ‹
                        </div>

                        {!groupImageFailed ? (
                            <img
                                className="wa-group-avatar-image"
                                src={GROUP_AVATAR_SRC}
                                alt="Profilbild des Klassenchats"
                                onError={() => setGroupImageFailed(true)}
                            />
                        ) : (
                            <div className="wa-group-avatar-fallback">7b</div>
                        )}

                        <div className="wa-header-text">
                            <div className="wa-group-name">Klassenchat 7b</div>
                            <div className="wa-participants">
                                Max, Mia, Nina, Tom und weitere
                            </div>
                        </div>

                        <div className="wa-options" aria-hidden="true">
                            ⋮
                        </div>
                    </header>

                    <main className="wa-chat-area">
                        <div className="wa-date-pill">Heute</div>

                        {(caseData.studentChat ?? caseData.fallbackChat ?? []).map((message, index) => (
                            <WhatsAppMessage
                                key={`${message.sender}-${message.time}-${index}`}
                                message={message}
                                index={index}
                                isSelectionActive={isMessageSelectionActive}
                                isSelectionEditable={isMessageSelectionEditable}
                                selectedMessages={selectedMessages}
                                maxSelections={maxMessageSelections}
                                onToggleMessage={onToggleMessage}
                            />
                        ))}
                    </main>
                </div>
            </div>
        </aside>
    );
}
