"use client";

import { X } from "lucide-react";
import ExampleTile from "./ExampleTileTutorial";

interface TutorialProps {
  onClose: () => void;
}

export function Tutorial({ onClose }: TutorialProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#121213] text-white max-w-md w-full mx-4 p-6 rounded-lg relative max-h-[90vh] overflow-y-auto border border-[#3a3a3c]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#818384] hover:text-white transition-colors"
          aria-label="Cerrar tutorial"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold mb-4">Como Jugar</h2>
        <p className="text-sm text-[#818384] mb-4">
          Adivina la palabra en 6 intentos.
        </p>

        <ul className="text-sm text-[#818384] mb-6 list-disc pl-5 flex flex-col gap-1">
          <li>Cada intento debe ser una palabra valida de 5 letras.</li>
          <li>
            El color de las casillas cambiara para mostrar que tan cerca
            estuviste de la palabra.
          </li>
        </ul>

        <p className="text-sm font-bold mb-3">Ejemplos</p>

        <div className="mb-4">
          <div className="flex gap-1 mb-2">
            <ExampleTile letter="G" variant="correct" />
            <ExampleTile letter="A" variant="default" />
            <ExampleTile letter="T" variant="default" />
            <ExampleTile letter="O" variant="default" />
            <ExampleTile letter="S" variant="default" />
          </div>
          <p className="text-sm text-[#818384]">
            <strong className="text-white">G</strong> esta en la palabra y en la
            posicion correcta.
          </p>
        </div>

        <div className="mb-4">
          <div className="flex gap-1 mb-2">
            <ExampleTile letter="F" variant="default" />
            <ExampleTile letter="U" variant="present" />
            <ExampleTile letter="E" variant="default" />
            <ExampleTile letter="G" variant="default" />
            <ExampleTile letter="O" variant="default" />
          </div>
          <p className="text-sm text-[#818384]">
            <strong className="text-white">U</strong> esta en la palabra pero en
            una posicion incorrecta.
          </p>
        </div>

        <div className="mb-6">
          <div className="flex gap-1 mb-2">
            <ExampleTile letter="P" variant="default" />
            <ExampleTile letter="L" variant="default" />
            <ExampleTile letter="A" variant="default" />
            <ExampleTile letter="Y" variant="absent" />
            <ExampleTile letter="A" variant="default" />
          </div>
          <p className="text-sm text-[#818384]">
            <strong className="text-white">Y</strong> no esta en la palabra en
            ninguna posicion.
          </p>
        </div>

        <hr className="border-[#3a3a3c] mb-4" />

        <p className="text-sm text-center text-[#818384]">
          Hay una palabra nueva disponible cada vez que juegas.
        </p>

        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-[#538d4e] text-white font-bold rounded hover:bg-[#4a7d45] transition-colors"
        >
          Jugar
        </button>

      </div>
    </div>
  );
}
