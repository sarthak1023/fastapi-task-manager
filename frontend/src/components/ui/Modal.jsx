import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Centered dialog over a dimmed page. Render it only while it should be open.
// Closes on Escape, the X button or a click on the backdrop.
function Modal({ title, description, onClose, children, footer, size = "md" }) {
    const panelRef = useRef(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") onCloseRef.current();
        }
        document.addEventListener("keydown", handleKeyDown);

        // Move keyboard focus into the dialog: a marked element, else the first field, else the panel
        const panel = panelRef.current;
        const target = panel?.querySelector("[data-autofocus]") || panel?.querySelector("input, textarea, select");
        (target || panel)?.focus();

        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => onCloseRef.current()} aria-hidden="true" />
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className={`relative max-h-[90vh] w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl focus:outline-none ${size === "sm" ? "max-w-md" : "max-w-lg"}`}
            >
                <div className="flex items-start justify-between gap-4 px-6 pt-5">
                    <div>
                        <h2 id="modal-title" className="text-base font-semibold text-slate-900">{title}</h2>
                        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
                    </div>
                    <button type="button" onClick={() => onCloseRef.current()} aria-label="Close"
                        className="-mr-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                {children ? <div className="px-6 py-5">{children}</div> : <div className="h-5" />}

                {footer && (
                    <div className="flex justify-end gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-6 py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Modal;
