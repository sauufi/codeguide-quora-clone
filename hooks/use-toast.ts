"use client";

import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const toast = {
    success: (message: string, options?: ToastOptions) => {
      return sonnerToast.success(message, {
        description: options?.description,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick,
        } : undefined,
      });
    },
    error: (message: string, options?: ToastOptions) => {
      return sonnerToast.error(message, {
        description: options?.description,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick,
        } : undefined,
      });
    },
    info: (message: string, options?: ToastOptions) => {
      return sonnerToast.info(message, {
        description: options?.description,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick,
        } : undefined,
      });
    },
    warning: (message: string, options?: ToastOptions) => {
      return sonnerToast.warning(message, {
        description: options?.description,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick,
        } : undefined,
      });
    },
    default: (message: string, options?: ToastOptions) => {
      return sonnerToast(message, {
        description: options?.description,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick,
        } : undefined,
      });
    },
    dismiss: (id?: string | number) => {
      return sonnerToast.dismiss(id);
    },
    loading: (message: string, options?: ToastOptions) => {
      return sonnerToast.loading(message, {
        description: options?.description,
      });
    },
  };

  // Backward compatibility - allow direct call with message and options
  return (message: string, options?: ToastOptions & { variant?: "default" | "destructive" }) => {
    if (options?.variant === "destructive") {
      return toast.error(message, options);
    }
    return toast.success(message, options);
  };
};

// Export toast for direct usage
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, options);
  },
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, options);
  },
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, options);
  },
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, options);
  },
  dismiss: sonnerToast.dismiss,
  loading: sonnerToast.loading,
};