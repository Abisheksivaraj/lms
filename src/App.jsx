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

  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [duration, setDuration] = useState("");

  const key = apiKey;
  const genAI = new GoogleGenerativeAI(key);

  const contentRef = useRef();

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
    } catch (error) {
      console.error("Error fetching data:", error);
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

  const handleDownloadPdf = () => {
    const element = contentRef.current;
    html2pdf().from(element).save();
  };

  const handleDownloadPpt = () => {
    const pptx = new PptxGenJS();

    // Split the content into lines
    const lines = apiData.split("\n");

    // Variables to store the topic and its definition
    let topicTitle = lines[0]; // Assuming the first line is the main topic
    let topicDefinition = "";
    let subtopicStartIndex = 1;

    // Find the definition of the topic until a subtopic keyword is encountered
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^[A-Z]/)) {
        // Assuming subtopics start with a capital letter
        subtopicStartIndex = i;
        break;
      }
      topicDefinition += line + "\n";
    }

    // Add the main information to the first slide
    const slide1 = pptx.addSlide({ bkgd: "002060" }); // Set the background color to blue (hexadecimal color code for blue)
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

    // Process the rest of the lines to create subtopic slides
    const subtopics = lines.slice(subtopicStartIndex);
    let currentSubtopic = "";
    let currentContent = "";

    const addContentToSlide = (pptx, title, content, backgroundColor) => {
      const maxHeight = 5; // Maximum height available for content
      const titleHeight = 1; // Height reserved for the title
      const fontSize = 18; // Font size for content
      const lineHeight = 0.7; // Estimated height for each line of text

      const contentLines = content.split("\n");
      let slide = pptx.addSlide({ bkgd: backgroundColor });
      slide.addText(title, {
        x: 1,
        y: 1,
        fontSize: 24,
        color: "363636",
        fontFace: "Arial",
      });

      let y = titleHeight + 1.5; // Initial y position after the title
      contentLines.forEach((line, index) => {
        if (y + lineHeight > maxHeight) {
          // Add new slide if current slide exceeds max height
          slide = pptx.addSlide({ bkgd: backgroundColor });
          slide.addText(title, {
            x: 1,
            y: 1,
            fontSize: 24,
            color: "363636",
            fontFace: "Arial",
          });
          y = titleHeight + 1.5; // Reset y position for new slide
        }
        slide.addText(line, {
          x: 1,
          y: y,
          fontSize: fontSize,
          color: "363636",
          fontFace: "Arial",
          bullet: true,
        });
        y += lineHeight; // Increment y position
      });
    };

    // Define colors for each subtopic
    const colors = ["600080", "008000", "FFFFFF", "808080"]; // Hexadecimal color codes for purple, green, white, and gray

    subtopics.forEach((line, index) => {
      const color = colors[index % colors.length]; // Loop through colors
      if (line.match(/^[A-Z]/)) {
        // Assuming each subtopic starts with a capital letter
        if (currentSubtopic) {
          // Add the current subtopic and its content to a new slide
          addContentToSlide(
            pptx,
            currentSubtopic,
            currentContent.trim(),
            color
          );
        }
        // Start a new subtopic
        currentSubtopic = line;
        currentContent = "";
      } else {
        currentContent += line + "\n";
      }
    });

    // Add the last subtopic and its content to a new slide
    if (currentSubtopic) {
      addContentToSlide(
        pptx,
        currentSubtopic,
        currentContent.trim(),
        colors[colors.length - 1]
      );
    }

    // Save the PowerPoint file
    pptx.writeFile({ fileName: `${topic}_Lesson_Plan.pptx` });
  };

  return (
    <div className="container mx-auto p-10 rounded-md w-[80%] flex flex-col mt-8.-+
    -+
    -+
    -+
    -+
    
    
    
    
    items-center justify-center h-auto bg-white  shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Lesson Plan Generator
      </h1>
      {/* <h3 className="text-xl mb-6">Lesson Plan Generator</h3> */}
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
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your topic here"
              required
            />
          </div>
          <div className="form-group">
            <label
              htmlFor="grade"
              className="block text-sm font-medium text-gray-700"
            >
              Grade
            </label>
            <input
              type="text"
              className="mt-1 block bg-slate-200 w-[35rem] p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Enter the grade here"
              required
            />
          </div>
          <div className="form-group">
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700"
            >
              Duration
            </label>
            <input
              type="text"
              className="mt-1 block w-[35rem] p-2 border bg-slate-200 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Enter the duration here"
              required
            />
          </div>

          <div className="form-group ">
            <label className="block text-sm font-medium text-gray-700">
              Delivery Type
            </label>
            <div className="mt-1 flex items-start gap-8">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="activityBased"
                  name="deliveryType"
                  checked={deliveryType === "Activity Based"}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  value="Activity Based"
                  className="mr-2 text-gray-300"
                />
                <label
                  htmlFor="activityBased"
                  className="text-sm font-medium text-gray-500"
                >
                  Activity Based
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="enquiryBased"
                  name="deliveryType"
                  checked={deliveryType === "Enquiry Based"}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  value="Enquiry Based"
                  className="mr-2"
                />
                <label
                  htmlFor="enquiryBased"
                  className="text-sm font-medium text-gray-500"
                >
                  Enquiry Based
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="experimentalLearning"
                  name="deliveryType"
                  checked={deliveryType === "Experimental Learning"}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  value="Experimental Learning"
                  className="mr-2"
                />
                <label
                  htmlFor="experimentalLearning"
                  className="text-sm font-medium text-gray-500"
                >
                  Experimental Learning
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="content"
                  name="deliveryType"
                  checked={deliveryType === "Content"}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  value="Content"
                  className="mr-2"
                />
                <label
                  htmlFor="content"
                  className="text-sm font-medium text-gray-500"
                >
                  Content
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-200 to-cyan-400 text-[1.3rem] font-semibold text-white px-4 py-4 w-[30rem] rounded-md shadow-sm hover:bg-indigo-700"
          >
            Submit
          </button>
        </form>
      </div>
      {loading ? (
        <div className="flex justify-center items-center">
          <svg
            className="animate-spin h-5 w-5 text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-2">Loading...</span>
        </div>
      ) : (
        showContent && (
          <div className="response-container mt-4">
            <div className="bg-white shadow-[0px_20px_20px_10px_#a0aec0] p-6 rounded-lg  border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Generated Content
              </h2>
              <div
                ref={contentRef}
                className="p-4 rounded-md border border-gray-100"
              >
                <pre className="whitespace-pre-wrap text-gray-800 text-xl font-sans">
                  {apiData}
                </pre>
              </div>
              <button
                onClick={handleRegenerate}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 mr-4 rounded-md shadow-sm hover:bg-indigo-700"
              >
                <HiOutlineRefresh />
              </button>
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-[#248424] text-sm font-medium text-gray-700"
                >
                  <FaDownload className="text-[black]" />
                </button>

                {isOpen && (
                  <div
                    className="origin-top-right absolute right-0  mt-[-5rem] mr-[-5rem] w-20 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                  >
                    <div className="p-2 w-full  " role="none">
                      <button
                        onClick={handleDownloadPdf}
                        className="block px-4 py-2 text-sm text-gray-700 hover:rounded-md hover:bg-[#9de89d] hover:text-gray-900 w-full text-left"
                        role="menuitem"
                      >
                        PDF
                      </button>
                      <button
                        onClick={handleDownloadPpt}
                        className="block px-4 py-2 text-sm text-gray-700 hover:rounded-md hover:bg-[#9de89d]  hover:text-gray-900 w-full text-left"
                        role="menuitem"
                      >
                        PPT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default App;

// import { useState, useRef } from "react";
// import "./App.css";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import apiKey from "./data";
// import html2pdf from "html2pdf.js";
// import PptxGenJS from "pptxgenjs";
// import { FaDownload } from "react-icons/fa";
// import { HiOutlineRefresh } from "react-icons/hi";

// function App() {
//   const [loading, setLoading] = useState(false);
//   const [apiData, setApiData] = useState("");
//   const [showContent, setShowContent] = useState(false);
//   const [isOpen, setIsOpen] = useState(false);

//   const [topic, setTopic] = useState("");
//   const [grade, setGrade] = useState("");
//   const [duration, setDuration] = useState("");
//   const [deliveryType, setDeliveryType] = useState(""); // New state variable for delivery type

//   const key = apiKey;
//   const genAI = new GoogleGenerativeAI(key);

//   const contentRef = useRef();

//   const fetchData = async () => {
//     try {
//       const model = await genAI.getGenerativeModel({ model: "gemini-pro" });
//       const fullPrompt = `
//         I'm a teacher for grade ${grade}th, I want to teach about ${topic} for ${duration} minutes.
//         Delivery Type: ${deliveryType}
//       `;
//       const result = await model.generateContent(fullPrompt);
//       const response = await result.response;
//       const text = await response.text();
//       const cleanedText = text.replace(/\*/g, "");
//       setApiData(cleanedText);
//       setLoading(false);
//       setShowContent(true);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setLoading(false);
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setShowContent(false);
//     fetchData();
//   };

//   const handleRegenerate = () => {
//     setLoading(true);
//     setShowContent(false);
//     fetchData();
//   };

//   const handleDownloadPdf = () => {
//     const element = contentRef.current;
//     html2pdf().from(element).save();
//   };

//   const handleDownloadPpt = () => {
//     const pptx = new PptxGenJS();

//     // Split the content into lines
//     const lines = apiData.split("\n");

//     // Variables to store the topic and its definition
//     let topicTitle = lines[0]; // Assuming the first line is the main topic
//     let topicDefinition = "";
//     let subtopicStartIndex = 1;

//     // Find the definition of the topic until a subtopic keyword is encountered
//     for (let i = 1; i < lines.length; i++) {
//       const line = lines[i].trim();
//       if (line.match(/^[A-Z]/)) {
//         // Assuming subtopics start with a capital letter
//         subtopicStartIndex = i;
//         break;
//       }
//       topicDefinition += line + "\n";
//     }

//     // Add the main information to the first slide
//     const slide1 = pptx.addSlide({ bkgd: "002060" }); // Set the background color to blue (hexadecimal color code for blue)
//     slide1.addText(`Lesson: ${topicTitle}`, {
//       x: "15%",
//       y: 2,
//       fontSize: 24,
//       color: "363636",
//       fontFace: "Arial",
//       align: "center",
//       w: "70%",
//     });
//     slide1.addText(`Time: ${duration}`, {
//       x: "20%",
//       y: 3,
//       fontSize: 18,
//       color: "363636",
//       fontFace: "Arial",
//       align: "center",
//       w: "60%",
//     });
//     slide1.addText(`Grade: ${grade}`, {
//       x: "20%",
//       y: 3.5,
//       fontSize: 18,
//       color: "363636",
//       fontFace: "Arial",
//       align: "center",
//       w: "60%",
//     });
//     slide1.addText(`Subject: ${topic}`, {
//       x: "20%",
//       y: 4,
//       fontSize: 18,
//       color: "363636",
//       fontFace: "Arial",
//       align: "center",
//       w: "60%",
//     });
//     slide1.addText(topicDefinition.trim(), {
//       x: "50%",
//       y: 3,
//       fontSize: 18,
//       color: "363636",
//       fontFace: "Arial",
//       align: "center",
//       w: "100%",
//     });

//     // Process the rest of the lines to create subtopic slides
//     const subtopics = lines.slice(subtopicStartIndex);
//     let currentSubtopic = "";
//     let currentContent = "";

//     const addContentToSlide = (pptx, title, content, backgroundColor) => {
//       const maxHeight = 5; // Maximum height available for content
//       const titleHeight = 1; // Height reserved for the title
//       const fontSize = 18; // Font size for content
//       const lineHeight = 0.7; // Estimated height for each line of text

//       const contentLines = content.split("\n");
//       let slide = pptx.addSlide({ bkgd: backgroundColor });
//       slide.addText(title, {
//         x: 1,
//         y: 1,
//         fontSize: 24,
//         color: "363636",
//         fontFace: "Arial",
//       });

//       let y = titleHeight + 1.5; // Initial y position after the title
//       contentLines.forEach((line, index) => {
//         if (y + lineHeight > maxHeight) {
//           // Add new slide if current slide exceeds max height
//           slide = pptx.addSlide({ bkgd: backgroundColor });
//           slide.addText(title, {
//             x: 1,
//             y: 1,
//             fontSize: 24,
//             color: "363636",
//             fontFace: "Arial",
//           });
//           y = titleHeight + 1.5; // Reset y position for new slide
//         }
//         slide.addText(line, {
//           x: 1,
//           y: y,
//           fontSize: fontSize,
//           color: "363636",
//           fontFace: "Arial",
//           bullet: true,
//         });
//         y += lineHeight; // Increment y position
//       });
//     };

//     // Define colors for each subtopic
//     const colors = ["600080", "008000", "FFFFFF", "808080"]; // Hexadecimal color codes for purple, green, white, and gray

//     subtopics.forEach((line, index) => {
//       const color = colors[index % colors.length]; // Loop through colors
//       if (line.match(/^[A-Z]/)) {
//         // Assuming each subtopic starts with a capital letter
//         if (currentSubtopic) {
//           // Add the current subtopic and its content to a new slide
//           addContentToSlide(
//             pptx,
//             currentSubtopic,
//             currentContent.trim(),
//             color
//           );
//         }
//         // Start a new subtopic
//         currentSubtopic = line;
//         currentContent = "";
//       } else {
//         currentContent += line + "\n";
//       }
//     });

//     // Add the last subtopic and its content to a new slide
//     if (currentSubtopic) {
//       addContentToSlide(
//         pptx,
//         currentSubtopic,
//         currentContent.trim(),
//         colors[colors.length - 1]
//       );
//     }

//     // Save the PowerPoint file
//     pptx.writeFile({ fileName: `${topic}_Lesson_Plan.pptx` });
//   };

//   return (
//     <div className="container mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-4">Learning Management System</h1>
//       <h3 className="text-xl mb-6">Lesson Plan Generator</h3>
//       <div className="form-container mb-10">
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="form-group">
//             <label
//               htmlFor="topic"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Topic
//             </label>
//             <input
//               type="text"
//               className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//               id="topic"
//               value={topic}
//               onChange={(e) => setTopic(e.target.value)}
//               placeholder="Enter your topic here"
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label
//               htmlFor="grade"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Grade
//             </label>
//             <input
//               type="text"
//               className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//               id="grade"
//               value={grade}
//               onChange={(e) => setGrade(e.target.value)}
//               placeholder="Enter your grade here"
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label
//               htmlFor="duration"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Duration
//             </label>
//             <input
//               type="text"
//               className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//               id="duration"
//               value={duration}
//               onChange={(e) => setDuration(e.target.value)}
//               placeholder="Enter duration in minutes"
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label
//               className="block text-sm font-medium text-gray-700"
//             >
//               Delivery Type
//             </label>
//             <div className="flex items-center space-x-4">
//               <label className="flex items-center space-x-2">
//                 <input
//                   type="radio"
//                   name="deliveryType"
//                   value="theory"
//                   checked={deliveryType === "theory"}
//                   onChange={(e) => setDeliveryType(e.target.value)}
//                   required
//                 />
//                 <span>Theory</span>
//               </label>
//               <label className="flex items-center space-x-2">
//                 <input
//                   type="radio"
//                   name="deliveryType"
//                   value="activity"
//                   checked={deliveryType === "activity"}
//                   onChange={(e) => setDeliveryType(e.target.value)}
//                   required
//                 />
//                 <span>Activity</span>
//               </label>
//               <label className="flex items-center space-x-2">
//                 <input
//                   type="radio"
//                   name="deliveryType"
//                   value="both"
//                   checked={deliveryType === "both"}
//                   onChange={(e) => setDeliveryType(e.target.value)}
//                   required
//                 />
//                 <span>Both</span>
//               </label>
//             </div>
//           </div>
//           <button
//             type="submit"
//             className="w-full p-2 bg-blue-500 text-white font-semibold rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//           >
//             {loading ? "Loading..." : "Generate Lesson Plan"}
//           </button>
//         </form>
//       </div>
//       {showContent && (
//         <div className="content-container mb-10">
//           <h2 className="text-xl font-bold mb-4">Generated Lesson Plan</h2>
//           <div ref={contentRef} className="generated-content p-4 border border-gray-300 rounded-md shadow-sm">
//             {apiData.split("\n").map((line, index) => (
//               <p key={index}>{line}</p>
//             ))}
//           </div>
//           <div className="button-group mt-6 flex space-x-4">
//             <button
//               onClick={handleDownloadPdf}
//               className="p-2 bg-green-500 text-white font-semibold rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//             >
//               <FaDownload className="inline-block mr-2" />
//               Download PDF
//             </button>
//             <button
//               onClick={handleDownloadPpt}
//               className="p-2 bg-purple-500 text-white font-semibold rounded-md shadow-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
//             >
//               <FaDownload className="inline-block mr-2" />
//               Download PPT
//             </button>
//             <button
//               onClick={handleRegenerate}
//               className="p-2 bg-yellow-500 text-white font-semibold rounded-md shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
//             >
//               <HiOutlineRefresh className="inline-block mr-2" />
//               Regenerate
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;
