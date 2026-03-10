"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Web Speech API types (not in all TypeScript libs)
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Track whether we WANT to be listening (vs browser auto-stopping)
  const wantListeningRef = useRef(false);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
        !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  const createRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = "sv-SE";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are harmless — the browser just didn't
      // hear anything yet. We auto-restart in onend if we still want to listen.
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      // Real errors (not-allowed, network, etc.) — stop for real
      console.error("Speech recognition error:", event.error);
      wantListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      // The browser can stop recognition on its own (silence timeout,
      // "no-speech", etc.). If we still want to listen, restart it.
      if (wantListeningRef.current) {
        try {
          const newRecognition = createRecognition();
          if (newRecognition) {
            recognitionRef.current = newRecognition;
            newRecognition.start();
          }
        } catch {
          wantListeningRef.current = false;
          setIsListening(false);
        }
        return;
      }
      setIsListening(false);
    };

    return recognition;
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    wantListeningRef.current = true;
    recognition.start();
    setIsListening(true);
    setTranscript("");
  }, [isSupported, createRecognition]);

  const stopListening = useCallback(() => {
    wantListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
