export default function ReadChatStart({ onConfirm }) {
    return (
        <section className="work-panel read-chat-panel">
            <button
                className="read-chat-button"
                type="button"
                onClick={onConfirm}
            >
                Wir haben den Chat gelesen
            </button>
        </section>
    );
}