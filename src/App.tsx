import React, { useState, useEffect } from "react";
import { useCompletion } from "ai/react";
import "./index.css";

function App() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("formal");
  const [length, setLength] = useState("medium");
  const [generatedContent, setGeneratedContent] = useState({
    title: "",
    content: "",
  });

  const { complete, completion, isLoading } = useCompletion({
    api: "/generate-content",
    onResponse: (response) => {
      console.log("Streaming started", response);
      const reader = response.body?.getReader();
      if (reader) {
        readStream(reader);
      }
    },
    onFinish: (prompt, completion) => {
      console.log("Streaming finished", completion);
    },
  });

  const readStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>
  ) => {
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          if (jsonStr === "[DONE]") {
            console.log("Stream complete");
          } else {
            try {
              const parsedData = JSON.parse(jsonStr);
              setGeneratedContent((prev) => ({ ...prev, ...parsedData }));
            } catch (error) {
              console.error("Failed to parse JSON:", error);
            }
          }
        }
      }

      buffer = lines[lines.length - 1];
    }
  };

  useEffect(() => {
    if (completion) {
      try {
        const parsedCompletion = JSON.parse(completion);
        setGeneratedContent(parsedCompletion);
      } catch (error) {
        console.error("Failed to parse completion:", error);
      }
    }
  }, [completion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratedContent({ title: "", content: "" });
    await complete("", {
      body: { topic, audience, tone, length },
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  return (
    <div className="App min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-4xl sm:mx-auto w-full px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              Content Generator
            </h1>
          </header>
          <main>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Topic"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Audience"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="humorous">Humorous</option>
              </select>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
              <button
                type="submit"
                disabled={isLoading || !topic || !audience || !tone || !length}
                className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 disabled:opacity-50"
              >
                Generate Content
              </button>
            </form>
            {isLoading && (
              <p className="mt-4 text-center text-gray-600">
                Generating content...
              </p>
            )}
            <div className="mt-6 bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {generatedContent.title || "No title yet"}
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {generatedContent.content || "No content yet"}
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
