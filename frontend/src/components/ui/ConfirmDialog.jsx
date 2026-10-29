import Modal from "./Modal";
import { alertStyles, buttonStyles } from "./styles";

// "Are you sure?" dialog for destructive actions. Focus starts on Cancel, the safe choice.
function ConfirmDialog({ title, message, confirmLabel = "Delete", busyLabel = "Deleting...", busy = false, error, onConfirm, onCancel }) {
    return (
        <Modal
            title={title}
            description={message}
            size="sm"
            onClose={() => { if (!busy) onCancel(); }}
            footer={
                <>
                    <button type="button" data-autofocus onClick={onCancel} disabled={busy} className={buttonStyles.secondary}>
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm} disabled={busy} className={buttonStyles.danger}>
                        {busy ? busyLabel : confirmLabel}
                    </button>
                </>
            }
        >
            {error ? <p className={alertStyles.error}>{error}</p> : null}
        </Modal>
    );
}

export default ConfirmDialog;
