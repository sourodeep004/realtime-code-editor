import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  FiCopy,
  FiUsers,
  FiLogOut,
  FiCode,
} from "react-icons/fi";

const socket = io("https://realtime-code-editor-zwp3.onrender.com");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Start coding here...");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is typing`);
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      toast.success("Joined room!");
      setJoined(true);
    } else {
      toast.error("Fill all fields");
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    toast("Room left");

    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// Start coding here...");
    setLanguage("javascript");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied!");
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);

    socket.emit("codeChange", {
      roomId,
      code: newCode,
    });

    socket.emit("typing", {
      roomId,
      userName,
    });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;

    setLanguage(newLanguage);

    socket.emit("languageChange", {
      roomId,
      language: newLanguage,
    });
  };

  if (!joined) {
    return (
      <div className="join-container">
        <Toaster position="top-right" />

        <motion.div
          className="join-form"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="logo">
            <FiCode /> CollabCode
          </h1>

          <p>Real-time collaborative code editor</p>

          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <input
            type="text"
            placeholder="Enter Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />

          <button onClick={joinRoom}>
            <FiCode /> Join Room
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <Toaster position="top-right" />

      <motion.div
        className="sidebar"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="room-info">
          <h2>Room: {roomId}</h2>

          <p className="live-status">
            🟢 Live Collaboration
          </p>

          <button
            onClick={copyRoomId}
            className="copy-button"
          >
            <FiCopy /> Copy Room
          </button>
        </div>

        <h3>
          <FiUsers /> Users Online
        </h3>

        <ul>
          {users.map((user, index) => (
            <li key={index}>
              <span className="avatar">
                {user.charAt(0).toUpperCase()}
              </span>
              {user.slice(0, 10)}
            </li>
          ))}
        </ul>

        <p className="typing-indicator">
          {typing && `⌨️ ${typing}`}
        </p>

        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        <button
          className="leave-button"
          onClick={leaveRoom}
        >
          <FiLogOut /> Leave Room
        </button>
      </motion.div>

      <motion.div
        className="editor-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: {
              enabled: false,
            },
            fontSize: 15,
            fontFamily: "Fira Code",
            smoothScrolling: true,
            padding: {
              top: 20,
            },
          }}
        />
      </motion.div>
    </div>
  );
};

export default App;