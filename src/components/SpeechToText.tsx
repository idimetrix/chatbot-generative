// "use client";

// import React, { useState, useCallback } from "react";

// // Define the SpeechRecognition type
// interface IWindow extends Window {
//   webkitSpeechRecognition: any;
// }

// export default function SpeechToText() {
//   const [text, setText] = useState<string>("");
//   const [isListening, setIsListening] = useState(false);

//   const handleOnRecord = useCallback(() => {
//     const windowWithSpeechRecognition = window as IWindow & typeof globalThis;
//     const SpeechRecognition = windowWithSpeechRecognition.SpeechRecognition || windowWithSpeechRecognition.webkitSpeechRecognition;

//     if (!SpeechRecognition) {
//       alert("Speech recognition is not supported in this browser.");
//       return;
//     }

//     const recognition = new SpeechRecognition();
//     recognition.lang = 'en-US';
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;

//     recognition.onstart = () => {
//       setIsListening(true);
//     };

//     recognition.onresult = (event: any) => {
//       const transcript = event.results[0][0].transcript;
//       setText((prevText) => prevText + " " + transcript);
//     };

//     recognition.onerror = (event: any) => {
//       console.error("Speech recognition error", event);
//       setIsListening(false);
//     };

//     recognition.onend = () => {
//       setIsListening(false);
//     };

//     recognition.start();
//   }, []);

//   return (
//     <div>
//       <p>Spoken Text: {text}</p>
//       <button onClick={handleOnRecord} disabled={isListening}>
//         {isListening ? "Listening..." : "Start Recording"}
//       </button>
//     </div>
//   );
// }