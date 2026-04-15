"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SharedImageContextType {
  sharedFile: File | null;
  sharedFileName: string;
  setSharedImage: (file: File) => void;
  clearSharedImage: () => void;
}

const SharedImageContext = createContext<SharedImageContextType>({
  sharedFile: null,
  sharedFileName: "",
  setSharedImage: () => {},
  clearSharedImage: () => {},
});

export function SharedImageProvider({ children }: { children: ReactNode }) {
  const [sharedFile, setSharedFile] = useState<File | null>(null);
  const [sharedFileName, setSharedFileName] = useState("");

  const setSharedImage = useCallback((file: File) => {
    setSharedFile(file);
    setSharedFileName(file.name);
  }, []);

  const clearSharedImage = useCallback(() => {
    setSharedFile(null);
    setSharedFileName("");
  }, []);

  return (
    <SharedImageContext.Provider value={{ sharedFile, sharedFileName, setSharedImage, clearSharedImage }}>
      {children}
    </SharedImageContext.Provider>
  );
}

export function useSharedImage() {
  return useContext(SharedImageContext);
}
