import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialIcon } from "./MaterialIcon";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-24 right-4 z-[9999] flex w-[calc(100%-32px)] max-w-sm flex-col gap-3.5 pointer-events-none md:top-28 md:right-6">
        <AnimatePresence>
          {toasts.map((toast) => {
            let typeStyles = "";
            let iconName = "";
            let accentColor = "";

            switch (toast.type) {
              case "success":
                typeStyles = "border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/20";
                iconName = "check_circle";
                accentColor = "text-emerald-500";
                break;
              case "error":
                typeStyles = "border-rose-500/20 bg-rose-50/70 dark:bg-rose-950/20";
                iconName = "error";
                accentColor = "text-rose-500";
                break;
              case "warning":
                typeStyles = "border-amber-500/20 bg-amber-50/70 dark:bg-amber-950/20";
                iconName = "warning";
                accentColor = "text-amber-500";
                break;
              case "info":
              default:
                typeStyles = "border-primary/20 bg-soft-amethyst/30";
                iconName = "info";
                accentColor = "text-primary";
                break;
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -15, scale: 0.95, filter: "blur(2px)", transition: { duration: 0.25 } }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`glass-panel pointer-events-auto flex items-start gap-3.5 rounded-[20px] p-4 shadow-[0_12px_36px_rgba(74,59,82,0.08)] border ${typeStyles} max-w-full`}
                role="alert"
              >
                <div className={`mt-0.5 shrink-0 text-[20px] ${accentColor}`}>
                  <MaterialIcon name={iconName} />
                </div>
                
                <div className="flex-1 text-sm font-medium leading-relaxed text-midnight-purple font-sans select-none">
                  {toast.message}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 text-dusk-gray hover:text-midnight-purple transition p-0.5 rounded-full hover:bg-white/40"
                  aria-label="Đóng"
                >
                  <MaterialIcon name="close" className="text-[16px]" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
