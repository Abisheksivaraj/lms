import { useState, useRef, useEffect } from "react";
import "./App.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import apiKey from "./data";
import html2pdf from "html2pdf.js";
import PptxGenJS from "pptxgenjs";
import { FaDownload } from "react-icons/fa";
import { HiOutlineRefresh } from "react-icons/hi";

function App() {
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [deliveryType, setDeliveryType] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showAssessmentPrompt, setShowAssessmentPrompt] = useState(false);
  const [assessmentData, setAssessmentData] = useState("");
  const [expandedHistory, setExpandedHistory] = useState(null);

  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [duration, setDuration] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);

  const key = apiKey;
  const genAI = new GoogleGenerativeAI(key);

  const contentRef = useRef();
  const assessmentRef = useRef();

  useEffect(() => {
    const storedHistory =
      JSON.parse(localStorage.getItem("searchHistory")) || [];
    setSearchHistory(storedHistory);
  }, []);

  const fetchData = async () => {
    try {
      const model = await genAI.getGenerativeModel({ model: "gemini-pro" });
      const fullPrompt = `
         I'm a teacher for grade ${grade}th, I want to teach about ${topic} for ${duration} minutes. Generate a lesson plan with this Delivery Type: ${deliveryType} and add 10 questions and answers. Based on the grade the questions must be tough`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = await response.text();
      const cleanedText = text.replace(/\*/g, "");
      setApiData(cleanedText);
      setLoading(false);
      setShowContent(true);
      setShowAssessmentPrompt(true);

      const newHistory = [
        ...searchHistory,
        { topic, grade, duration, deliveryType, result: cleanedText },
      ];
      setSearchHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const generateAssessment = async () => {
    try {
      const model = await genAI.getGenerativeModel({ model: "gemini-pro" });
      const fullPrompt = `
         Based on the lesson plan for ${topic}, generate an assessment with 10 MCQ questions and answers for grade ${grade}.`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = await response.text();
      const cleanedText = text.replace(/\*/g, "");
      setAssessmentData(cleanedText);
      setLoading(false);
      setShowAssessmentPrompt(false);
    } catch (error) {
      console.error("Error generating assessment:", error);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setShowContent(false);
    fetchData();
  };

  const handleRegenerate = () => {
    setLoading(true);
    setShowContent(false);
    fetchData();
  };

  const handleDownloadContentPdf = () => {
    const element = contentRef.current;

    // Apply styles to the content before generating PDF
    element.style.fontFamily = "Arial, sans-serif";
    element.style.fontSize = "12px";
    element.style.color = "#333";
    element.style.padding = "10px";

    html2pdf().from(element).save();
  };


  const handleDownloadAssessmentPdf = () => {
    const element = contentRef.current;

    // Apply styles to the content before generating PDF
    element.style.fontFamily = "Arial, sans-serif";
    element.style.fontSize = "12px";
    element.style.color = "#333";
    element.style.padding = "10px";

    html2pdf().from(element).save();
  };


  const handleDownloadPpt = () => {
    const pptx = new PptxGenJS();

    const lines = apiData.split("\n");

    let topicTitle = lines[0];
    let topicDefinition = "";
    let subtopicStartIndex = 1;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^[A-Z]/)) {
        subtopicStartIndex = i;
        break;
      }
      topicDefinition += line + "\n";
    }

    const slide1 = pptx.addSlide({ bkgd: "002060" });
    slide1.addText(`Lesson: ${topicTitle}`, {
      x: "15%",
      y: 2,
      fontSize: 24,
      color: "363636",
      fontFace: "Arial",
      align: "center",
      w: "70%",
    });
    slide1.addText(`Time: ${duration}`, {
      x: "20%",
      y: 3,
      fontSize: 18,
      color: "363636",
      fontFace: "Arial",
      align: "center",
      w: "60%",
    });
    slide1.addText(`Grade: ${grade}`, {
      x: "20%",
      y: 3.5,
      fontSize: 18,
      color: "363636",
      fontFace: "Arial",
      align: "center",
      w: "60%",
    });
    slide1.addText(`Subject: ${topic}`, {
      x: "20%",
      y: 4,
      fontSize: 18,
      color: "363636",
      fontFace: "Arial",
      align: "center",
      w: "60%",
    });
    slide1.addText(topicDefinition.trim(), {
      x: "50%",
      y: 3,
      fontSize: 18,
      color: "363636",
      fontFace: "Arial",
      align: "center",
      w: "100%",
    });

    const subtopics = lines.slice(subtopicStartIndex);
    let currentSubtopic = "";
    let currentContent = "";

    const addContentToSlide = (pptx, title, content, backgroundColor) => {
      const maxHeight = 5;
      const titleHeight = 1;
      const fontSize = 18;
      const lineHeight = 0.7;

      const contentLines = content.split("\n");
      let slide = pptx.addSlide({ bkgd: backgroundColor });
      slide.addText(title, {
        x: 1,
        y: 1,
        fontSize: 24,
        color: "363636",
        fontFace: "Arial",
      });

      let y = titleHeight + 1.5;
      contentLines.forEach((line, index) => {
        if (y + lineHeight > maxHeight) {
          slide = pptx.addSlide({ bkgd: backgroundColor });
          slide.addText(title, {
            x: 1,
            y: 1,
            fontSize: 24,
            color: "363636",
            fontFace: "Arial",
          });
          y = titleHeight + 1.5;
        }
        slide.addText(line, {
          x: 1,
          y: y,
          fontSize: fontSize,
          color: "363636",
          fontFace: "Arial",
          bullet: true,
        });
        y += lineHeight;
      });
    };

    const colors = ["600080", "008000", "FFFFFF", "808080"];

    subtopics.forEach((line, index) => {
      const color = colors[index % colors.length];
      if (line.match(/^[A-Z]/)) {
        if (currentSubtopic) {
          addContentToSlide(
            pptx,
            currentSubtopic,
            currentContent.trim(),
            color
          );
        }
        currentSubtopic = line;
        currentContent = "";
      } else {
        currentContent += line + "\n";
      }
    });

    if (currentSubtopic) {
      addContentToSlide(
        pptx,
        currentSubtopic,
        currentContent.trim(),
        colors[colors.length - 1]
      );
    }

    pptx.writeFile({ fileName: `${topic}_Lesson_Plan.pptx` });
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const handleToggleHistory = (index) => {
    setExpandedHistory((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className="container mx-auto p-10 rounded-md flex mt-8 items-start justify-center h-auto bg-white shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]">
      <div className="p-4 sm:w-96 flex-grow border-r-4 h-auto">
        <h1 className="text-2xl font-semibold mb-5">Lesson Plan Generator</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="topic" className="block text-base font-medium mb-2">
              Topic:
            </label>
            <input
              type="text"
              id="topic"
              className="w-full p-2 text-[#969595] bg-slate-200 border border-gray-300 rounded-md"
              value={topic}
              placeholder="Enter Tour Topic Here"
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 w-[35rem] text-gray-700">
              Grade
              <select
                className="w-full text-[#969595] p-2 border bg-slate-200 border-gray-300 rounded-md"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                <option value="topic">Enter Your Grade Here</option>
                <option value="first">1st Grade</option>
                <option value="second">2nd Grade</option>
                <option value="third">3rd Grade</option>
                <option value="fourth">4th Grade</option>
                <option value="fifth">5th Grade</option>
                <option value="sixth">6th Grade</option>
                <option value="seventh">7th Grade</option>
                <option value="eight">8th Grade</option>
                <option value="nine">9th Grade</option>
                <option value="ten">10th Grade</option>
                <option value="eleven">11th Grade</option>
                <option value="twelve">12th Grade</option>
              </select>
            </label>
          </div>
          <div className="mb-5">
            <label
              htmlFor="duration"
              className="block text-base font-medium mb-2"
            >
              Duration (in mins):
            </label>
            <input
              type="text"
              id="duration"
              className="w-full text-[#969595] bg-slate-200 p-2 border border-gray-300 rounded-md"
              value={duration}
              placeholder="Enter your Duration In Minutes"
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div className="mb-5">
            <label
              htmlFor="deliveryType"
              className="block text-base font-medium mb-2"
            >
              Delivery Type:
            </label>
            <select
              id="deliveryType"
              className="w-full p-2 text-[#969595] bg-slate-200 border border-gray-300 rounded-md"
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value)}
              required
            >
              <option value="">Select Delivery Type</option>
              <option value="Lecture">Lecture</option>
              <option value="Discussion">Discussion</option>
              <option value="Hands-on">Hands-on</option>
              <option value="Project-based">Project-based</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md font-semibold hover:bg-blue-600 transition-colors"
          >
            {loading ? "Loading..." : "Generate Lesson Plan"}
          </button>
        </form>
        {showContent && (
          <div className="mt-5">
            <div className="flex justify-between mb-3">
              <h2 className="text-lg font-semibold">Lesson Plan</h2>
              <div className="flex space-x-3">
                <button
                  onClick={handleDownloadContentPdf}
                  className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  <FaDownload className="inline-block mr-1" />
                  Download PDF
                </button>
                <button
                  onClick={handleDownloadPpt}
                  className="bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition-colors"
                >
                  <FaDownload className="inline-block mr-1" />
                  Download PPT
                </button>
                <button
                  onClick={handleRegenerate}
                  className="bg-yellow-500 text-white p-2 rounded-md hover:bg-yellow-600 transition-colors"
                >
                  <HiOutlineRefresh className="inline-block mr-1" />
                  Regenerate
                </button>
              </div>
            </div>
            <div
              className="bg-gray-100 p-4 rounded-md shadow-md"
              ref={contentRef}
            >
              <pre className="whitespace-pre-wrap text-gray-800 text-l font-sans">{apiData}</pre>
            </div>
            {showAssessmentPrompt && (
              <div className="mt-5">
                <button
                  onClick={generateAssessment}
                  className="w-full bg-blue-500 text-white py-2 rounded-md font-semibold hover:bg-blue-600 transition-colors"
                >
                  {loading ? "Loading..." : "Generate Assessment"}
                </button>
              </div>
            )}
          </div>
        )}
        {assessmentData && (
          <div className="mt-5">
            <div className="flex justify-between mb-3">
              <h2 className="text-lg font-semibold">Assessment</h2>
              <div className="flex space-x-3">
                <button
                  onClick={handleDownloadAssessmentPdf}
                  className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  <FaDownload className="inline-block mr-1" />
                  Download PDF
                </button>
              </div>
            </div>
            <div
              className="bg-gray-100 p-4 rounded-md shadow-md"
              ref={assessmentRef}
            >
              <pre className="whitespace-pre-wrap">{assessmentData}</pre>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 sm:w-96 flex-grow">
        <h2 className="text-2xl font-semibold mb-5">Search History</h2>
        {searchHistory.length > 0 ? (
          <div>
            {searchHistory.map((item, index) => (
              <div
                key={index}
                className="mb-3 p-4 border border-gray-300 rounded-md bg-white shadow-md"
              >
                <div
                  className="cursor-pointer font-medium text-lg"
                  onClick={() => handleToggleHistory(index)}
                >
                  {item.topic}
                </div>
                {expandedHistory === index && (
                  <div>
                    <div className="text-sm text-gray-500">
                      Grade: {item.grade}
                    </div>
                    <div className="text-sm text-gray-500">
                      Duration: {item.duration}
                    </div>
                    <div className="text-sm text-gray-500">
                      Delivery Type: {item.deliveryType}
                    </div>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {item.result}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={handleClearHistory}
              className="w-full bg-red-500 text-white py-2 rounded-md font-semibold hover:bg-red-600 transition-colors mt-5"
            >
              Clear History
            </button>
          </div>
        ) : (
          <p>No search history available.</p>
        )}
      </div>
    </div>
  );
}

export default App;
