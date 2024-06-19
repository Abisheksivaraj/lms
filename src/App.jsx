import { useState, useRef } from "react";
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

  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [duration, setDuration] = useState("");

  const key = apiKey;
  const genAI = new GoogleGenerativeAI(key);

  const contentRef = useRef();
  const assessmentRef = useRef();

  const fetchData = async () => {
    try {
      const model = await genAI.getGenerativeModel({ model: "gemini-pro" });
      const fullPrompt = `
         I'm a teacher for grade ${grade}th, I want to teach about ${topic} for ${duration} minutes.generate an lesson plan with this Delivery Type: ${deliveryType} and add 10 questions and answer.Based on the grade the questions must be in tuff`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = await response.text();
      const cleanedText = text.replace(/\*/g, "");
      setApiData(cleanedText);
      setLoading(false);
      setShowContent(true);
      setShowAssessmentPrompt(true);
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
    html2pdf().from(element).save();
  };

  const handleDownloadAssessmentPdf = () => {
    const element = assessmentRef.current;
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

    const colors = ["600080", "008000", "FFFFFF", "808080"]; // Hexadecimal color codes for purple, green, white, and gray

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

  return (
    <div className="container mx-auto p-10 rounded-md w-[80%] flex flex-col mt-8 items-center justify-center h-auto bg-white  shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Lesson Plan Generator
      </h1>
      <div className="form-container mb-10">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 flex flex-col items-center"
        >
          <div className="form-group">
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700"
            >
              Topic
            </label>
            <input
              type="text"
              className="mt-1 block  bg-slate-200 p-2 w-[35rem] border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              id="topic"
              value={topic}
              placeholder="Enter your topic here"
              required
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <label className="block mb-2 w-[35rem] text-gray-700">
            Grade
            <select
              className="w-full p-2 border bg-slate-200 border-gray-300 rounded-md"
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
          <div className="form-group">
            <label
              htmlFor="duration"
              className="block text-sm  font-medium text-gray-700"
            >
              Duration (minutes)
            </label>
            <input
              type="text"
              className="mt-1 block  bg-slate-200 p-2 w-[35rem] border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              id="duration"
              value={duration}
              placeholder="Enter your duration here"
              required
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <label className="block mb-2 w-[35rem] text-gray-700">
            Delivery Type:
            <select
              className="w-full p-2  bg-slate-200 border border-gray-300 rounded-md"
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value)}
            >
              <option value="valuee">Enter Your Delivery Type</option>
              <option value="Textbook">Textbook</option>
              <option value="Activity-based">Activity-based</option>
              <option value="Project-based">Project-based</option>
              <option value="Lecture-based">Lecture-based</option>
            </select>
          </label>

          <button
            type="submit"
            className="inline-block bg-[#007bff] text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            {loading ? (
              <span className="loader"></span>
            ) : (
              "Generate Lesson Plan"
            )}
          </button>
        </form>
      </div>
      {showContent && (
        <div className="max-w-4xl mx-auto mt-4 border border-gray-300 rounded-lg p-6 bg-gray-100 shadow-md relative">
          <pre className="whitespace-pre-wrap break-words" ref={contentRef}>
            {apiData}
          </pre>

          <div className="flex justify-start space-x-2 mt-4">
            <button
              className="absolute top-2 right-2 text-blue-500"
              onClick={handleRegenerate}
            >
              <HiOutlineRefresh className="w-5 h-5" />
            </button>
            <button
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 flex items-center"
              onClick={handleDownloadContentPdf}
            >
              <FaDownload className="mr-2" />
              Download as PDF
            </button>
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 flex items-center"
              onClick={handleDownloadPpt}
            >
              <FaDownload className="mr-2" />
              Download as PPT
            </button>
          </div>
        </div>
      )}
      {showAssessmentPrompt && (
        <div className="max-w-4xl mx-auto mt-4 border border-gray-300 rounded-lg p-6 bg-gray-100 shadow-md relative">
          <button
            className="inline-block bg-[#007bff] text-white py-2 px-4 rounded hover:bg-blue-600"
            onClick={generateAssessment}
          >
            Generate Assessment
          </button>
        </div>
      )}
      {assessmentData && (
        <div className="max-w-4xl mx-auto mt-4 border border-gray-300 rounded-lg p-6 bg-gray-100 shadow-md relative">
          <pre className="whitespace-pre-wrap break-words" ref={assessmentRef}>
            {assessmentData}
          </pre>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 flex items-center"
              onClick={handleDownloadAssessmentPdf}
            >
              <FaDownload className="mr-2" />
              Download as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
