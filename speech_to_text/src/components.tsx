import React, { useEffect, useState, useMemo } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { OpenAI } from "openai";

interface JsonStoredData {
  StartingDate: string | null;
  EndingDate: string | null;
  Persons: string | null;
  Location: string | null;
  ChildCount: string | null;
  AdultCount: string | null;
  Transcript: string | null;
}

interface SpeechToTextProps {
  apiKey: string;
}

export function SpeechToText({ apiKey }: SpeechToTextProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const { transcript, browserSupportsSpeechRecognition, resetTranscript } = useSpeechRecognition();
  const [jsonStoredData, setJsonStoredData] = useState<JsonStoredData>({
    StartingDate: null,
    EndingDate: null,
    Persons: null,
    Location: null,
    ChildCount: null,
    AdultCount: null,
    Transcript: null,
  });
  const openai = useMemo(() => {
    return new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
  }, [apiKey]);

  useEffect(() => {
    if (isListening) {
      SpeechRecognition.startListening({ continuous: true, language: "en-IN" });
    } else {
      SpeechRecognition.stopListening();
      resetTranscript();
    }
  }, [isListening, resetTranscript]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const startingDateCompletion = await openai.chat.completions.create({
          messages: [
            {
              role: "user",
              content:
                transcript +
                "Extract only the starting date from the provided content. If no starting date is found in content, provide only a single word null. Do not provide any additional information or results. Ensure the date format is in numbers and not in words like (01-jan-2024).Always provide data only date format do not want any text included with date either date or null",
            },
          ],
          model: "gpt-3.5-turbo",
        });
        const startingDate = startingDateCompletion.choices[0].message.content;

        const endingDateCompletion = await openai.chat.completions.create({
          messages: [
            {
              role: "user",
              content:
                transcript +
                "Extract only the ending date from the provided content. If no ending date is found in content provide only a single word null. Do not provide any additional information or results. Ensure the date format like (DD-MM-YYYY).Always provide data only date format do not want any text included with date either date or null",
            },
          ],
          model: "gpt-3.5-turbo",
        });
        const endingDate = endingDateCompletion.choices[0].message.content;

        const personsCompletion = await openai.chat.completions.create({
          messages: [
            {
              role: "user",
              content: transcript + "Extract the persons from the text , output should be only one number . If no persons are found, provide the number '0'. Do not provide any additional information or results.",
            },
          ],
          model: "gpt-3.5-turbo",
        });
        const persons = personsCompletion.choices[0].message.content;

        const locationCompletion = await openai.chat.completions.create({
          messages: [
            {
              role: "user",
              content: transcript + "Extract only location name from the text . Do not provide any additional information or results. If no location is found in content, provide a single word null . Do not provide any additional information or results.",
            },
          ],
          model: "gpt-3.5-turbo",
        });
        const location = locationCompletion.choices[0].message.content;

        const childCountCompletion = await openai.chat.completions.create({
          messages: [
            {
              role: "user",
              content:
                transcript +
                "Please extract the number of childs from the text. If no childs are found, provide the number '0'. Do not provide any additional information or results.",
            },
          ],
          model: "gpt-3.5-turbo",
        });
        const childCount = childCountCompletion.choices[0].message.content;

        const adultCountCompletion = await openai.chat.completions.create({
          messages: [
            {
              role: "user",
              content:
                transcript +
                "Please extract the number of adults from the text. If no adults are found, provide the number '0'. Do not provide any additional information or results.",
            },
          ],
          model: "gpt-3.5-turbo",
        });
        const adultCount = adultCountCompletion.choices[0].message.content;

        setJsonStoredData({
          StartingDate: startingDate,
          EndingDate: endingDate,
          Persons: persons,
          Location: location,
          ChildCount: childCount,
          AdultCount: adultCount,
          Transcript: transcript,
        });
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    if (transcript) {
      fetchData();
    }
  }, [transcript, setJsonStoredData, openai]);

  if (!browserSupportsSpeechRecognition) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  return (
    <>
      <div>
        <h2>Speech to Text Converter</h2><br />
        <button
          className={`${isListening
            ? "bg-red-500 hover:bg-red-700"
            : "bg-blue-500 hover:bg-blue-700"
          } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
          onClick={() => setIsListening(!isListening)}
        >
          {isListening ? "Click to stop" : "Tap to say"}
        </button>
        <p>Transcript: {transcript}</p>
        <pre>{JSON.stringify(jsonStoredData, null, 2)}</pre>
      </div>
    </>
  );
};
