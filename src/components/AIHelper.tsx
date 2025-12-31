"use client";

import { useState, useRef, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import Lottie from "lottie-react";
import danceCatAnimation from "../../public/dance-cat.json";

interface AIHelperProps {
  question: string;
  hint: string;
  theme: string;
  answers: string[];
  userName?: string;
}

export default function AIHelper({ question, hint, theme, answers, userName }: AIHelperProps) {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showText, setShowText] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { completion, isLoading, complete } = useCompletion({
    api: "/api/explain",
    streamProtocol: "text",
  });

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Auto-speak when completion is ready
  useEffect(() => {
    if (completion && !isLoading && isActive && !isSpeaking && !showText) {
      speak(completion);
    }
  }, [completion, isLoading, isActive, showText]);

  const speakWithBrowser = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      // No speech available, just show text
      setIsSpeaking(false);
      setShowText(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes("Samantha") || v.name.includes("Karen") || v.lang.startsWith("en")
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setIsSpeaking(false);
      setShowText(true);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setShowText(true);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speak = async (text: string) => {
    if (!text) return;

    setIsSpeaking(true);

    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        speakWithBrowser(text);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setShowText(true);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setShowText(true);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      speakWithBrowser(text);
    }
  };

  const handleAskHelp = async () => {
    setIsActive(true);
    setShowText(false);
    await complete("", {
      body: {
        question,
        hint,
        theme,
        answers,
        userName,
      },
    });
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setShowText(true);
  };

  const handleReplay = () => {
    if (completion) {
      setShowText(false);
      speak(completion);
    }
  };

  const isAnimating = isLoading || isSpeaking;

  return (
    <div className="flex flex-col items-center">
      {/* Initial state - paused cat, waiting for click */}
      {!isActive && (
        <button
          onClick={handleAskHelp}
          className="group relative transition-transform hover:scale-110 active:scale-95"
          title="Click me for help!"
        >
          <Lottie
            animationData={danceCatAnimation}
            loop={true}
            autoplay={false}
            className="h-36 w-36"
          />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-500 px-3 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            Need help?
          </span>
        </button>
      )}

      {/* Loading/Speaking state - animated cat, no text */}
      {isActive && !showText && (
        <div className="flex flex-col items-center">
          <Lottie
            animationData={danceCatAnimation}
            loop={true}
            autoplay={true}
            className="h-36 w-36"
          />
          <span className="mt-2 rounded-full bg-purple-500 px-4 py-1.5 text-sm font-semibold text-white animate-pulse">
            {isLoading ? "Thinking..." : "Speaking..."}
          </span>
          {isSpeaking && (
            <button
              onClick={handleStop}
              className="mt-2 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-95"
            >
              ⏹ Stop
            </button>
          )}
        </div>
      )}

      {/* Done state - show text with replay option */}
      {isActive && showText && completion && (
        <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lottie
                animationData={danceCatAnimation}
                loop={true}
                autoplay={false}
                className="h-12 w-12"
              />
              <span className="font-semibold text-gray-700">Cat Tutor</span>
            </div>
            <button
              onClick={handleReplay}
              className="rounded-lg bg-purple-500 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-purple-600 active:scale-95"
            >
              🔊 Replay
            </button>
          </div>
          <p className="text-gray-700 leading-relaxed">{completion}</p>
        </div>
      )}
    </div>
  );
}
