import { useState } from "react";
import "./ChatPanel.css";

const GROUP_AVATAR_SRC = "/chatbilder/klassenchat-7b-avatar.png";

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

function WhatsAppMessage({ message }) {
    const lowerText = String(message.text || "").toLowerCase();

    const isSystemMessage =
        lowerText.includes("bild wurde gesendet") ||
        lowerText.includes("screenshot wurde gesendet");

    if (isSystemMessage) {
        return <div className="wa-system-message">{message.text}</div>;
    }

    return (
        <div className="wa-message-row">
            <div className={`wa-avatar ${getAvatarClass(message.sender)}`}>
                {getInitials(message.sender)}
            </div>

            <div className="wa-bubble">
                <div className="wa-sender">{message.sender}</div>
                <div className="wa-text">{message.text}</div>

                <div className="wa-meta-row">
                    <span className="wa-time">{message.time}</span>
                    <span className="wa-checks" aria-hidden="true">
            ✓✓
          </span>
                </div>
            </div>
        </div>
    );
}

export default function ChatPanel({ caseData }) {
    const [groupImageFailed, setGroupImageFailed] = useState(false);

    return (
        <aside className="chat-panel">
            <div className="sticky-chat">
                <div className="wa-phone">
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

                        {caseData.fallbackChat.map((message, index) => (
                            <WhatsAppMessage
                                key={`${message.sender}-${message.time}-${index}`}
                                message={message}
                            />
                        ))}
                    </main>
                </div>
            </div>
        </aside>
    );
}