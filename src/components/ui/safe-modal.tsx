"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent } from "./dialog";

interface SafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SafeModal({
  isOpen,
  onClose,
  children,
  className = "",
}: SafeModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  // Only mount on client-side
  useEffect(() => {
    setIsMounted(true);

    // Create a dedicated portal element for this modal
    const el = document.createElement("div");
    el.id = `modal-portal-${Math.random().toString(36).substr(2, 9)}`;
    document.body.appendChild(el);
    setPortalElement(el);

    // Lock body scroll
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      // Restore body scroll
      document.body.style.overflow = originalStyle;

      // Remove portal element
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, []);

  // Handle cleanup when modal closes
  useEffect(() => {
    if (!isOpen && isMounted) {
      // Delay cleanup to allow animations
      const timer = setTimeout(() => {
        document.body.style.overflow = "";
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, isMounted]);

  // Prevent rendering on server
  if (!isMounted || !portalElement) {
    return null;
  }

  return createPortal(
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={className}>{children}</DialogContent>
    </Dialog>,
    portalElement
  );
}
