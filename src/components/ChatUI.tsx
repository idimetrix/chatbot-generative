"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import * as faceapi from "face-api.js";
// import { CiMicrophoneOn } from "react-icons/ci";

const ChatGPTUI = () => {
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const genAI = new GoogleGenerativeAI(
    process.env.NEXT_PUBLIC_GEMINI_API || ""
  );
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const videoRef = useRef<any>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Loading face detection model...");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        console.log("Face detection model loaded successfully");
      } catch (error) {
        console.error("Error loading face detection model:", error);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    const checkFace = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          console.log("Attempting face detection...");
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.5,
            })
          );
          console.log("Face detection result:", detections);
          setIsFaceDetected(detections.length > 0);
        } catch (error) {
          console.error("Error during face detection:", error);
        }
      } else {
        console.log(
          "Video not ready. ReadyState:",
          videoRef.current?.readyState
        );
      }
    };

    const interval = setInterval(checkFace, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    startVideo();
  }, []);

  useEffect(() => {
    if (browserSupportsSpeechRecognition) {
      SpeechRecognition.startListening({ continuous: true });
    }
    return () => {
      SpeechRecognition.stopListening();
    };
  }, []);

  const startListening = () => {
    SpeechRecognition.startListening({ continuous: true }).catch(
      (error: any) => {
        console.error("Error starting speech recognition:", error);
      }
    );
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (transcript) {
        setSearch(transcript);
        fetchData(transcript);
        resetTranscript();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [transcript]);

  const handleChangeSearch = (e: any) => {
    setSearch(e.target.value);
  };

  const cleanAndStructureText = (text: any) => {
    const sections = text.split("***").filter((s: any) => s.trim());

    const processedSections = sections.map((section: any) => {
      const [title] = section.split(":");
      return `${title.trim()}`;
    });

    return `${processedSections.join("")}`;
  };

  const fetchData = async (input?: string) => {
    const prompt = search || input || "";
    if (!prompt) return; // Don't proceed if there's no input

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log("Original text:", text);

      const cleanedText = cleanAndStructureText(text);
      console.log("Cleaned text:", cleanedText);
      const utterance = new SpeechSynthesisUtterance(cleanedText);

      // Optional: Adjust speech parameters
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);

      const userMessage = { text: prompt, isUser: true };
      const gptMessage = { text: text, isUser: false };
      setMessages((prevMessages) => [...prevMessages, userMessage, gptMessage]);
      setSearch("");
    } catch (error) {
      console.error("Error in fetchData:", error);
      // Handle the error appropriately (e.g., show an error message to the user)
    }
  };

  const handleSubmit = () => {
    fetchData();
    resetTranscript();
  };

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn&apos;t support speech recognition.</span>;
  }

  return (
    <div className="sm:relative max-h-[100vh] bg-[#101010] lg:w-[80%] mx-auto">
      <div className="md:absolute p-4 w-full relative">
        <div className="flex items-center justify-between my-8 px-4 lg:w-[70%] mx-auto">
          <h2 className="text-xl font-semibold font-mono">BadmanDev</h2>
          <div>
            <video
              ref={videoRef}
              autoPlay
              muted
              style={{ width: "150px", height: "150px" }}
            />
            <p className="text-red-600 text-small">
              {isFaceDetected ? "" : "Face not detected"}
            </p>
          </div>
        </div>

        <div className="overflow-container max-h-[70vh] overflow-y-auto lg:w-[70%] mx-auto p-4">
          {messages.map((message, index) => (
            <div key={index}>
              <div className="text-start mb-4 break-words">
                <span className="font-bold">
                  {message?.isUser ? "You" : "GPT"}
                </span>
                <p>{message?.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="right-0 absolute left-0 top-[84vh] mx-auto w-[60%]">
        <div className="w-full items-center">
          <div className="overflow-hidden flex flex-col w-full dark:border-token-border-heavy flex-grow relative border border-token-border-heavy dark:text-white rounded-2xl bg-white dark:bg-gray-800 shadow-[0_0_0_2px_rgba(255,255,255,0.95)] dark:shadow-[0_0_0_2px_rgba(52,53,65,0.95)]">
            <textarea
              id="prompt-textarea"
              tabIndex={0}
              rows={1}
              placeholder="Message"
              value={search}
              onKeyDown={handleKeyDown}
              onChange={handleChangeSearch}
              className="m-0 w-full resize-none border-0 bg-[#343541] py-[10px] pr-10 focus:ring-0 focus-visible:ring-0 md:py-3.5 md:pr-12 placeholder-black/50 dark:placeholder-white/50 pl-3 md:pl-4"
              style={{ maxHeight: "200px", overflowY: "hidden" }}
            ></textarea>
            <button
              onClick={handleSubmit}
              className="absolute bg-white md:bottom-3 md:right-3 dark:hover:bg-white right-2 disabled:opacity-10 disabled:text-gray-400 enabled:bg-white text-white p-0.5 border border-black rounded-lg dark:border-white dark:bg-white bottom-1.5 transition-colors"
            >
              <span data-state="closed">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white dark:text-black"
                >
                  <path
                    d="M7 11L12 6L17 11M12 18V7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </span>
            </button>
          </div>
          <span>
            <button onClick={listening ? stopListening : startListening}>
              {listening ? "Stop" : "Start"} Listening
            </button>
          </span>
        </div>
        <div className="text-center mt-4">
          <h1>&copy; 2024</h1>
        </div>
      </div>
    </div>
  );
};

export default ChatGPTUI;
