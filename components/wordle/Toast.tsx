"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string | null;
}

const DURATION = 300;

export function Toast({ message }: ToastProps) {
  const [render, setRender] = useState(false);
  const [show, setShow] = useState(false);
  const [internalMessage, setInternalMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setInternalMessage(message);
      setRender(true);

      setTimeout(() => {
        setShow(true);
      }, 10);
    } else if (render) {
      setShow(false);

      const timeout = setTimeout(() => {
        setRender(false);
        setInternalMessage(null);
      }, DURATION);

      return () => clearTimeout(timeout);
    }
  }, [message]);

  if (!render) return null;

  return (
    <div
      className={`
        absolute top-16 left-1/2 -translate-x-1/2 z-50
        bg-white text-[#121213] font-bold text-sm
        px-4 py-3 rounded shadow-lg
        transition-all duration-300 ease-in-out
        ${show
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4"}
      `}
    >
      {internalMessage}
    </div>
  );
}