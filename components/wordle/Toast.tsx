"use client";

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-white text-[#121213] font-bold text-sm px-4 py-3 rounded shadow-lg animate-fade-in">
      {message}
    </div>
  );
}
