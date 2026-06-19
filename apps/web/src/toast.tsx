import * as React from "react";

// Minimal zero-dep toast (no react-hot-toast / sonner): context + provider + hook.

type ToastType = "info" | "success" | "error";
type ToastItem = { id: number; type: ToastType; message: string };

const ToastContext = React.createContext<((type: ToastType, message: string) => void) | null>(null);

export function useToast() {
  const push = React.useContext(ToastContext);
  if (!push) throw new Error("useToast must be used within <ToastProvider>");
  return push;
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const remove = React.useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (type: ToastType, message: string) => {
      const id = nextId++;
      setToasts((list) => [...list, { id, type, message }]);
      setTimeout(() => remove(id), type === "error" ? 6000 : 4000);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <button
            type="button"
            key={t.id}
            className={`toast toast-${t.type}`}
            onClick={() => remove(t.id)}
            title="Dismiss"
          >
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
