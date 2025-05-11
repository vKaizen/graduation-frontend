// Adapted from shadcn-ui's toast component
import { useEffect, useState } from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
};

type Toast = ToastProps & {
  id: string;
  timeout: NodeJS.Timeout;
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);

    const toast: Toast = {
      id,
      title,
      description,
      variant,
      timeout: setTimeout(() => {
        setToasts((toasts) => toasts.filter((t) => t.id !== id));
      }, 5000), // Auto dismiss after 5 seconds
    };

    setToasts((toasts) => [...toasts, toast]);

    return id;
  };

  useEffect(() => {
    // Clean up timeouts on unmount
    return () => {
      toasts.forEach((toast) => clearTimeout(toast.timeout));
    };
  }, [toasts]);

  const dismiss = (id: string) => {
    setToasts((toasts) => {
      const toast = toasts.find((t) => t.id === id);
      if (toast) {
        clearTimeout(toast.timeout);
      }
      return toasts.filter((t) => t.id !== id);
    });
  };

  return {
    toast,
    dismiss,
    toasts,
  };
}
