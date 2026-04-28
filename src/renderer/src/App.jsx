import React, { useState, useEffect, useRef, useCallback } from "react";
import TaskCard from "./components/TaskCard";

const FloatingRoutineManager = () => {
  // State
  const [tasks, setTasks] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [nextTask, setNextTask] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const [timeConflictError, setTimeConflictError] = useState("");
  const [previousTask, setPreviousTask] = useState(null);
  const [showActiveTaskNotes, setShowActiveTaskNotes] = useState(false); // Fixed state name

  // Refs
  const taskListRef = useRef(null);
  const currentTaskRef = useRef(null);
  const activeTaskContainerRef = useRef(null); // Ref for active task container

  const [editTask, setEditTask] = useState({
    id: "",
    title: "",
    startTime: "",
    endTime: "",
    category: "default",
    icon: "⭐",
    notes: "", // Added notes field
  });

  const [newTask, setNewTask] = useState({
    title: "",
    startTime: "",
    endTime: "",
    category: "default",
    icon: "⭐",
    notes: "", // Added notes field
  });

  // Refs
  const mainInterval = useRef(null);
  const audioRef = useRef(null);
  const expandTimeoutRef = useRef(null);

  // Default tasks with habit categories and notes
  const defaultTasks = [
    {
      id: 1,
      title: "Morning Meditation",
      startTime: "05:30",
      endTime: "06:00",
      category: "meditate",
      icon: "🧘",
      notes:
        "- Focus on breathing\n- 10 min mindfulness\n- Set daily intention",
      manuallyCompleted: false,
      manuallySkipped: false,
    },
    {
      id: 2,
      title: "Workout",
      startTime: "06:00",
      endTime: "07:00",
      category: "fitness",
      icon: "💪",
      notes: "- Warm up 10 min\n- Strength training\n- Cool down stretches",
      manuallyCompleted: false,
      manuallySkipped: false,
    },
    {
      id: 3,
      title: "Shower & Get Ready",
      startTime: "07:00",
      endTime: "07:30",
      category: "selfcare",
      icon: "🚿",
      notes: "- Cold shower\n- Skincare routine\n- Dress for success",
      manuallyCompleted: false,
      manuallySkipped: false,
    },
    {
      id: 4,
      title: "Study: Project A",
      startTime: "07:30",
      endTime: "09:00",
      category: "study",
      icon: "📚",
      notes: "- Review notes\n- Complete chapter 3\n- Practice problems",
      manuallyCompleted: false,
      manuallySkipped: false,
    },
    {
      id: 5,
      title: "Breakfast",
      startTime: "09:00",
      endTime: "09:30",
      category: "nutrition",
      icon: "🍳",
      notes: "- Protein rich meal\n- Hydrate with water\n- No distractions",
      manuallyCompleted: false,
      manuallySkipped: false,
    },
  ];

  // Popular emojis for quick selection
  const popularEmojis = [
    "⭐",
    "🧘",
    "💪",
    "🚿",
    "📚",
    "🍳",
    "☕",
    "💼",
    "🚶",
    "😴",
    "🎵",
    "✍️",
    "📖",
    "🏃",
    "🚴",
    "🧠",
    "💡",
    "🎯",
    "🏆",
    "❤️",
    "🌞",
    "🌙",
    "🍎",
    "💧",
    "🔥",
    "❄️",
    "🌈",
    "🎨",
    "⚽",
    "🎮",
  ];

  // Preload audio when component mounts
  useEffect(() => {
    const preloadAudio = () => {
      try {
        audioRef.current = new Audio();
        audioRef.current.src = "../resources/happy-bell.mp3";
        audioRef.current.volume = 1.0;
        audioRef.current.preload = "auto";
        audioRef.current.load();
        console.log("Audio preloaded successfully");
      } catch (error) {
        console.log("Audio preload failed:", error);
      }
    };
    preloadAudio();
  }, []);

  useEffect(() => {
    // Preload audio only once
    const audio = new Audio();
    audio.src = "./assets/happy-bell.mp3";
    audio.preload = "auto";
    audio.volume = 0.5; // Lower volume
    audioRef.current = audio;

    return () => {
      // Cleanup audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!audioRef.current) return;

    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => {
        console.log("Audio play failed:", e);
      });
    } catch (error) {
      console.log("Audio error:", error);
    }
  }, []);

  // Fallback sound in case custom sound fails
  const playFallbackSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.7,
        audioContext.currentTime + 0.1
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      oscillator.onended = () => {
        audioContext.close();
      };
    } catch (fallbackError) {
      console.log("All audio methods failed");
    }
  }, []);

  // Auto-expand window when new task starts
  const autoExpandForNewTask = useCallback(
    (newCurrentTask) => {
      if (isMinimized && newCurrentTask) {
        const isNewTaskStarting =
          !previousTask ||
          previousTask.id !== newCurrentTask.id ||
          previousTask.status !== "active";

        if (isNewTaskStarting) {
          console.log(
            "New task starting, expanding window:",
            newCurrentTask.title
          );
          setIsMinimized(false);

          if (window.electronAPI) {
            window.electronAPI.minimizeWindow();
          }

          if (expandTimeoutRef.current) {
            clearTimeout(expandTimeoutRef.current);
          }

          expandTimeoutRef.current = setTimeout(() => {
            if (!isEditMode && !activeModal) {
              setIsMinimized(true);
              if (window.electronAPI) {
                window.electronAPI.minimizeWindow();
              }
            }
          }, 10000);
        }
      }
      setPreviousTask(newCurrentTask);
    },
    [isMinimized, previousTask, isEditMode, activeModal]
  );

  // Helper functions
  const parseTime = (timeStr) => {
    if (!timeStr) return new Date();
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (timeStr) => {
    const date = parseTime(timeStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatCountdown = (ms) => {
    if (ms < 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`;
    } else {
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
      )}`;
    }
  };

  const formatMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let str = "";
    if (hours > 0) str += `${hours}h `;
    str += `${minutes}m`;
    return str;
  };

  const sortTasks = (taskList) => {
    return [...taskList].sort((a, b) => {
      const timeA = parseTime(a.startTime).getTime();
      const timeB = parseTime(b.startTime).getTime();
      return timeA - timeB;
    });
  };

  // Check for time conflicts
  const hasTimeConflict = (startTime, endTime, excludeTaskId = null) => {
    const newStart = parseTime(startTime).getTime();
    const newEnd = parseTime(endTime).getTime();

    if (newStart >= newEnd) {
      setTimeConflictError("End time must be after start time");
      return true;
    }

    for (const task of tasks) {
      if (task.id === excludeTaskId) continue;
      const existingStart = parseTime(task.startTime).getTime();
      const existingEnd = parseTime(task.endTime).getTime();

      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        setTimeConflictError(
          `Time conflict with "${task.title}" (${formatTime(
            task.startTime
          )} - ${formatTime(task.endTime)})`
        );
        return true;
      }
    }

    setTimeConflictError("");
    return false;
  };

  // Get suggested time slots
  const getSuggestedTimeSlots = () => {
    if (tasks.length === 0) {
      return [
        { start: "06:00", end: "07:00", label: "Morning slot" },
        { start: "12:00", end: "13:00", label: "Lunch slot" },
        { start: "18:00", end: "19:00", label: "Evening slot" },
      ];
    }

    const suggestions = [];
    const sortedTasks = sortTasks(tasks);

    // Check before first task
    const firstTask = sortedTasks[0];
    const firstStart = parseTime(firstTask.startTime);
    if (firstStart.getHours() > 5) {
      suggestions.push({
        start: "05:00",
        end: firstTask.startTime,
        label: `Before ${firstTask.title}`,
      });
    }

    // Check between tasks
    for (let i = 0; i < sortedTasks.length - 1; i++) {
      const currentTask = sortedTasks[i];
      const nextTask = sortedTasks[i + 1];
      const currentEnd = parseTime(currentTask.endTime);
      const nextStart = parseTime(nextTask.startTime);
      const gapMinutes = (nextStart - currentEnd) / (1000 * 60);

      if (gapMinutes >= 30) {
        suggestions.push({
          start: currentTask.endTime,
          end: nextTask.startTime,
          label: `Between ${currentTask.title} and ${nextTask.title}`,
        });
      }
    }

    // Check after last task
    const lastTask = sortedTasks[sortedTasks.length - 1];
    const lastEnd = parseTime(lastTask.endTime);
    if (lastEnd.getHours() < 23) {
      const suggestedStart = new Date(lastEnd);
      suggestedStart.setMinutes(lastEnd.getMinutes() + 30);

      if (suggestedStart.getHours() < 23) {
        const suggestedEnd = new Date(suggestedStart);
        suggestedEnd.setHours(suggestedStart.getHours() + 1);

        suggestions.push({
          start: `${String(suggestedStart.getHours()).padStart(
            2,
            "0"
          )}:${String(suggestedStart.getMinutes()).padStart(2, "0")}`,
          end: `${String(suggestedEnd.getHours()).padStart(2, "0")}:${String(
            suggestedEnd.getMinutes()
          ).padStart(2, "0")}`,
          label: `After ${lastTask.title}`,
        });
      }
    }

    return suggestions.slice(0, 3);
  };

  // Data persistence
  const saveTasks = (taskList) => {
    localStorage.setItem("focusAppTasks", JSON.stringify(taskList));
  };

  const loadTasks = () => {
    const storedTasks = localStorage.getItem("focusAppTasks");
    if (storedTasks) {
      const parsedTasks = JSON.parse(storedTasks);
      const formattedTasks = parsedTasks.map((task) => ({
        ...getDefaultTaskFormat(),
        ...task,
        id: task.id || Date.now().toString(),
      }));
      setTasks(sortTasks(formattedTasks));
    } else {
      setTasks(sortTasks(defaultTasks));
    }
  };

  // Get complete default task format
  const getDefaultTaskFormat = () => ({
    id: "",
    title: "",
    startTime: "",
    endTime: "",
    category: "default",
    icon: "⭐",
    notes: "",
    status: "upcoming",
    manuallyCompleted: false,
    manuallySkipped: false,
  });

  // Get appropriate icon based on task content
  const getTaskIcon = (title, category, currentIcon) => {
    if (currentIcon && currentIcon !== "⭐") {
      return currentIcon;
    }

    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("meditat") || lowerTitle.includes("yoga")) {
      return "🧘";
    } else if (
      lowerTitle.includes("workout") ||
      lowerTitle.includes("exercise") ||
      lowerTitle.includes("gym")
    ) {
      return "💪";
    } else if (lowerTitle.includes("shower") || lowerTitle.includes("bath")) {
      return "🚿";
    } else if (
      lowerTitle.includes("study") ||
      lowerTitle.includes("read") ||
      lowerTitle.includes("learn")
    ) {
      return "📚";
    } else if (
      lowerTitle.includes("breakfast") ||
      lowerTitle.includes("lunch") ||
      lowerTitle.includes("dinner") ||
      lowerTitle.includes("eat")
    ) {
      return "🍳";
    } else if (lowerTitle.includes("coffee") || lowerTitle.includes("tea")) {
      return "☕";
    } else if (lowerTitle.includes("work") || lowerTitle.includes("meeting")) {
      return "💼";
    } else if (lowerTitle.includes("walk") || lowerTitle.includes("run")) {
      return "🚶";
    } else if (lowerTitle.includes("sleep") || lowerTitle.includes("nap")) {
      return "😴";
    } else if (
      lowerTitle.includes("music") ||
      lowerTitle.includes("practice")
    ) {
      return "🎵";
    } else if (lowerTitle.includes("write") || lowerTitle.includes("journal")) {
      return "✍️";
    }
    return "⭐";
  };

  const runMainLoop = useCallback(() => {
    const now = new Date();
    const nowTime = now.getTime();

    let currentTask = null;
    let nextTask = null;
    let completedCount = 0;

    const newTaskStatuses = tasks.map((task) => {
      const startTime = parseTime(task.startTime);
      const endTime = parseTime(task.endTime);
      let status = "upcoming";

      if (task.manuallyCompleted) {
        status = "completed";
        completedCount++;
      } else if (
        nowTime >= startTime.getTime() &&
        nowTime < endTime.getTime()
      ) {
        status = "active";
        currentTask = { ...task, status };
      } else if (nowTime >= endTime.getTime()) {
        status = "upcoming";
      } else {
        if (!nextTask && nowTime < startTime.getTime()) {
          nextTask = { ...task, status };
        }
      }
      return { ...task, status };
    });

    const isNewTaskStarting =
      currentTask && (!previousTask || previousTask.id !== currentTask.id);

    setTaskStatuses(newTaskStatuses);
    setCurrentTask(currentTask);
    setNextTask(nextTask);
    setCompletedCount(completedCount);

    if (isNewTaskStarting) {
      console.log("New task starting:", currentTask.title);
      playNotificationSound();
    }

    autoExpandForNewTask(currentTask);
    setPreviousTask(currentTask);
  }, [tasks]);

  // Add this useEffect to scroll to current task when expanded
  const [hasScrolledToCurrent, setHasScrolledToCurrent] = useState(false);

  useEffect(() => {
    if (!isMinimized && currentTask && !hasScrolledToCurrent) {
      setTimeout(() => {
        if (currentTaskRef.current) {
          currentTaskRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          setHasScrolledToCurrent(true);
        }
      }, 300);
    }
  }, [isMinimized, currentTask, hasScrolledToCurrent]);

  useEffect(() => {
    if (isMinimized) {
      setHasScrolledToCurrent(false);
    }
  }, [isMinimized]);

  useEffect(() => {
    setHasScrolledToCurrent(false);
  }, [currentTask?.id]);

  useEffect(() => {
    const appVersion = "v3";
    const storedVersion = localStorage.getItem("FRM_APP_VERSION");
    if (storedVersion !== appVersion) {
      localStorage.clear();
      localStorage.setItem("FRM_APP_VERSION", appVersion);
    }
    loadTasks();
  }, []);

  useEffect(() => {
    const runDebouncedLoop = () => {
      runMainLoop();
    };

    // Run every 5 seconds instead of every second
    mainInterval.current = setInterval(runDebouncedLoop, 5000);

    // Initial run
    runDebouncedLoop();

    return () => {
      if (mainInterval.current) {
        clearInterval(mainInterval.current);
      }
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
      }
    };
  }, []); // Remove runMainLoop from dependencies

  // Hide/show functionality
  const handleHideWindow = () => {
    setIsHidden(true);
    if (window.electronAPI) {
      window.electronAPI.hideWindow();
    }
  };

  const handleShowWindow = () => {
    setIsHidden(false);
    if (window.electronAPI) {
      window.electronAPI.showWindow();
    }
  };

  // Add this useEffect in your React component, near other useEffect hooks
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.requestWindowState();
      window.electronAPI.getWindowState().then((state) => {
        if (state) {
          setIsMinimized(state.isMinimized);
          setIsHidden(state.isHidden || false);
        }
      });
    }
  }, []);

  // Update the existing window state listener to be more robust
  // In your React component - Clean up IPC listeners properly
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleWindowState = (event, state) => {
      setIsMinimized(state.isMinimized);
      setIsHidden(state.isHidden || false);
    };

    // Get the specific ipcRenderer instance
    const ipcRenderer =
      window.electronAPI._ipcRenderer || require("electron").ipcRenderer;

    ipcRenderer.on("window-state", handleWindowState);

    return () => {
      // Proper cleanup
      ipcRenderer.removeAllListeners("window-state");
    };
  }, []);

  // CRUD operations
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.startTime || !newTask.endTime) return;

    if (hasTimeConflict(newTask.startTime, newTask.endTime)) {
      return;
    }

    const icon = getTaskIcon(newTask.title, newTask.category, newTask.icon);

    const taskToAdd = {
      ...newTask,
      id: Date.now().toString(),
      icon: newTask.icon !== "⭐" ? newTask.icon : icon,
      status: "upcoming",
      manuallyCompleted: false,
      manuallySkipped: false,
    };

    const updatedTasks = [...tasks, taskToAdd];
    setTasks(sortTasks(updatedTasks));
    saveTasks(updatedTasks);

    setNewTask({
      title: "",
      startTime: "",
      endTime: "",
      category: "default",
      icon: "⭐",
      notes: "",
    });

    setActiveModal(null);
    setTimeConflictError("");
  };

  const handleEditTask = (e) => {
    e.preventDefault();

    if (hasTimeConflict(editTask.startTime, editTask.endTime, editTask.id)) {
      return;
    }

    const icon = getTaskIcon(editTask.title, editTask.category, editTask.icon);

    const updatedTaskWithFormat = {
      ...getDefaultTaskFormat(),
      ...editTask,
      icon: editTask.icon !== "⭐" ? editTask.icon : icon,
    };

    const updatedTasks = tasks.map((task) =>
      task.id === editTask.id ? updatedTaskWithFormat : task
    );

    setTasks(sortTasks(updatedTasks));
    saveTasks(updatedTasks);
    setActiveModal(null);
    setTimeConflictError("");
  };

  const handleDeleteTask = (taskId) => {
    const newTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  // Manual completion handlers
  const handleCompleteTask = (taskId) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            manuallyCompleted: true,
            manuallySkipped: false,
          }
        : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const handleSkipTask = (taskId) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            manuallySkipped: true,
            manuallyCompleted: false,
          }
        : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  // Update the reset task handler to remove from auto-skipped
  const handleResetTask = (taskId) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            manuallyCompleted: false,
          }
        : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  // Modal functions
  const showModal = (modalName) => {
    setActiveModal(modalName);
    setTimeConflictError("");
  };

  const hideModal = () => {
    setActiveModal(null);
    setTimeConflictError("");
  };

  const openEditModal = (task) => {
    setEditTask({
      ...getDefaultTaskFormat(),
      ...task,
    });
    setActiveModal("edit");
    setTimeConflictError("");
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // Window management
  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized);

    if (!isMinimized && expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
    }

    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  // Progress calculation
  const progressPercentage =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  // Summary data
  const getSummaryData = () => {
    let totalMinutes = 0;
    let completedMinutes = 0;

    taskStatuses.forEach((task) => {
      const startTime = parseTime(task.startTime).getTime();
      const endTime = parseTime(task.endTime).getTime();
      const duration = (endTime - startTime) / (1000 * 60);
      totalMinutes += duration;

      if (task.status === "completed" || task.manuallyCompleted) {
        completedMinutes += duration;
      }
    });

    const percentage =
      tasks.length > 0 ? ((completedCount / tasks.length) * 100).toFixed(0) : 0;

    return {
      completedCount,
      totalTasks: tasks.length,
      percentage,
      completedMinutes: formatMinutes(completedMinutes),
      totalMinutes: formatMinutes(totalMinutes),
    };
  };

  // Color mapping for habit categories (simplified without color selection)
  const getColorClass = () => {
    return "bg-cyan-100 text-cyan-800"; // Single color theme
  };

  // Time change handlers with validation
  const handleNewTaskTimeChange = (field, value) => {
    setNewTask({ ...newTask, [field]: value });

    if (newTask.startTime && newTask.endTime) {
      if (field === "startTime") {
        hasTimeConflict(value, newTask.endTime);
      } else {
        hasTimeConflict(newTask.startTime, value);
      }
    }
  };

  const handleEditTaskTimeChange = (field, value) => {
    setEditTask({ ...editTask, [field]: value });

    if (editTask.startTime && editTask.endTime) {
      if (field === "startTime") {
        hasTimeConflict(value, editTask.endTime, editTask.id);
      } else {
        hasTimeConflict(editTask.startTime, value, editTask.id);
      }
    }
  };

  // Use suggested time slot
  const useSuggestedTime = (startTime, endTime) => {
    if (activeModal === "add") {
      setNewTask({
        ...newTask,
        startTime,
        endTime,
      });
    } else if (activeModal === "edit") {
      setEditTask({
        ...editTask,
        startTime,
        endTime,
      });
    }
    setTimeConflictError("");
  };

  // Emoji selection handler
  const handleEmojiSelect = (emoji, isNewTask = true) => {
    if (isNewTask) {
      setNewTask({ ...newTask, icon: emoji });
    } else {
      setEditTask({ ...editTask, icon: emoji });
    }
  };

  // Render functions - UPDATED WITH FIXED NOTES FUNCTIONALITY
  const renderActiveTask = () => {
    const now = new Date().getTime();

    if (currentTask) {
      const endTime = parseTime(currentTask.endTime);
      const remainingMs = endTime.getTime() - now;
      const countdown = formatCountdown(remainingMs);

      return (
        <div
          ref={activeTaskContainerRef}
          className={`p-4 rounded-2xl transition-all duration-300 bg-white shadow-soft border border-white/50 relative ${
            isEditMode ? "ring-2 ring-yellow-400 ring-opacity-50" : ""
          }`}
          onMouseEnter={() => currentTask.notes && setShowActiveTaskNotes(true)}
          onMouseLeave={() => setShowActiveTaskNotes(false)}
        >
          {/* Main Active Task Content */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl ${getColorClass()}`}
              >
                {currentTask.icon}
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-800">
                  {currentTask.title}
                </h2>
                <p className="text-xs text-gray-600">
                  {formatTime(currentTask.startTime)} -{" "}
                  {formatTime(currentTask.endTime)}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
              ACTIVE
            </span>
          </div>
          <div className="text-center">
            <span className="text-xs text-gray-600">Time Remaining</span>
            <div className="font-mono text-3xl font-bold text-cyan-600 tracking-tight mt-1">
              {countdown}
            </div>
          </div>

          {/* Notes Overlay - Grey background overlapping the active container */}
          {showActiveTaskNotes && currentTask.notes && (
            <div className="absolute inset-0 bg-gray-800/90 rounded-2xl p-4 z-50 backdrop-blur-sm">
              <div className="flex flex-col h-full">
                {/* Header with close button */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-white">Task Notes</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActiveTaskNotes(false);
                    }}
                    className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
                    title="Close notes"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {/* Notes Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="text-white text-sm whitespace-pre-line leading-relaxed">
                    {currentTask.notes}
                  </div>
                </div>

                {/* Optional: Show that these are the current task's notes */}
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <p className="text-xs text-gray-400 text-center">
                    Notes for: {currentTask.title}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else if (nextTask) {
      return (
        <div
          className={`p-4 rounded-2xl transition-all duration-300 bg-white shadow-soft border border-white/50 ${
            isEditMode ? "ring-2 ring-yellow-400 ring-opacity-50" : ""
          }`}
        >
          <h2 className="font-semibold text-base text-gray-700 mb-2">
            Next Up:
          </h2>
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${getColorClass()}`}
            >
              {nextTask.icon}
            </div>
            <div>
              <p className="font-bold text-lg text-gray-800">
                {nextTask.title}
              </p>
              <p className="text-xs text-gray-600">
                Starts at {formatTime(nextTask.startTime)}
              </p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div
          className={`p-4 rounded-2xl transition-all duration-300 bg-white shadow-soft border border-white/50 text-center ${
            isEditMode ? "ring-2 ring-yellow-400 ring-opacity-50" : ""
          }`}
        >
          <div className="text-3xl mb-2">🌅</div>
          <h2 className="font-bold text-lg text-gray-800">
            All Done for Today!
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Enjoy your free time and rest well.
          </p>
        </div>
      );
    }
  };

  const renderTaskList = () => {
    if (tasks.length === 0) {
      return (
        <div className="text-center py-6">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-gray-600 text-sm">
            No tasks scheduled. Click the '+' to add your first habit!
          </p>
        </div>
      );
    }

    return tasks.map((task) => {
      const isCompleted = task.status === "completed" || task.manuallyCompleted;
      const isCurrent = currentTask && task.id === currentTask.id;

      const getTaskCardColors = (isCompleted, isCurrent) => {
        if (isCompleted) {
          return {
            iconColor: "from-green-100 to-green-50",
            ringColor: "ring-green-200",
            textColor: "text-green-800",
            bgColor: "bg-green-50",
          };
        }
        if (isCurrent) {
          return {
            iconColor: "from-cyan-100 to-cyan-50",
            ringColor: "ring-cyan-200",
            textColor: "text-cyan-800",
            bgColor: "bg-cyan-50",
          };
        }

        return {
          iconColor: "from-cyan-100 to-cyan-50",
          ringColor: "ring-cyan-200",
          textColor: "text-gray-800",
          bgColor: "bg-white",
        };
      };

      const colors = getTaskCardColors(isCompleted, isCurrent);

      return (
        <div
          key={task.id}
          className="relative group"
          ref={isCurrent ? currentTaskRef : null}
        >
          <TaskCard
            icon={task.icon}
            title={task.title}
            startTime={formatTime(task.startTime)}
            endTime={formatTime(task.endTime)}
            progressLabel="Day 3/30"
            iconColor={colors.iconColor}
            ringColor={colors.ringColor}
            textColor={colors.textColor}
            bgColor={colors.bgColor}
            isCompleted={isCompleted}
            isCurrent={isCurrent}
            onComplete={() => handleCompleteTask(task.id)}
            onReset={() => handleResetTask(task.id)}
            onClick={() => isEditMode && openEditModal(task)}
            isEditMode={isEditMode}
            className={
              isEditMode
                ? "cursor-pointer hover:scale-105 hover:shadow-lg transform transition-all duration-200 ring-2 ring-yellow-400"
                : ""
            }
          />

          {isEditMode && (
            <div className="absolute inset-0 bg-yellow-400/10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex gap-1">
                <button
                  onClick={() => openEditModal(task)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-50 hover:scale-110 transform transition-all duration-200"
                  title="Edit task"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 hover:scale-110 transform transition-all duration-200"
                  title="Delete task"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  const renderMinimizedView = () => {
    const now = new Date().getTime();
    let countdown = "--:--";
    let title = "Free Time";
    let icon = "🤩";

    if (currentTask) {
      const endTime = parseTime(currentTask.endTime);
      const remainingMs = endTime.getTime() - now;
      countdown = formatCountdown(remainingMs);
      title = currentTask.title;
      icon = currentTask.icon;
    }

    return (
      <div className="w-full  p-1 ">
        <div className="relative w-full group h-[92px]">
          {/* Main minimized view button */}
          <button
            className="w-full h-full focus:outline-none"
            onClick={handleMinimizeToggle}
          >
            <div
              className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-400
                      rounded-2xl shadow-[0_8px_20px_rgba(255,140,0,0.45)]
                      p-2 w-full h-full flex items-center justify-between
                      relative overflow-hidden transition-all duration-300
                      "
              style={{
                minHeight: "60px",
              }}
            >
              {/* Soft glow behind content */}
              <div className="absolute inset-0 bg-white/10 blur-xl pointer-events-none"></div>

              {/* Left Icon */}
              <div className="flex-shrink-0 relative z-10">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center
                          text-2xl font-bold bg-white/95 text-orange-700
                          border border-orange-200 shadow-xl
                          transition-transform duration-300
                          group-hover:scale-110"
                >
                  {icon}
                </div>
              </div>

              {/* Center Content */}
              <div className="flex-1 min-w-0 mx-3 text-center relative z-10">
                {/* Countdown */}
                <div
                  className="font-mono text-4xl font-black text-white
                          tracking-tight mb-1
                          drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]
                          animate-pulse"
                >
                  {countdown}
                </div>

                {/* Title */}
                <div
                  className="text-base text-white
                          bg-black/35 px-3 py-1 rounded-lg
                          shadow-md backdrop-blur-sm
                          tracking-wide truncate "
                >
                  {title}
                </div>
              </div>
            </div>
          </button>

          {/* Control buttons - appear on hover */}
          <div className="absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-1">
            {/* Expand button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMinimizeToggle();
              }}
              className="w-8 h-8 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center 
                      text-gray-700 hover:text-cyan-600 shadow-lg transition-all duration-200
                      hover:scale-110 backdrop-blur-sm"
              title="Expand"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            </button>

            {/* Hide button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleHideWindow();
              }}
              className="w-8 h-8 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center 
                      text-gray-700 hover:text-orange-600 shadow-lg transition-all duration-200
                      hover:scale-110 backdrop-blur-sm"
              title="Hide for 30 seconds"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>

          {/* Bottom controls divider */}
          <div className="absolute bottom-1 left-2 right-2 h-px bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </div>
    );
  };

  // Emoji picker component
  const renderEmojiPicker = (isNewTask = true) => {
    const currentIcon = isNewTask ? newTask.icon : editTask.icon;

    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Select Icon
        </label>

        {/* Current selection display */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getColorClass()}`}
          >
            {currentIcon}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">
              Current Icon
            </div>
            <div className="text-xs text-gray-500">
              Click an emoji below to change
            </div>
          </div>
        </div>

        {/* Quick emoji selection */}
        <div>
          <div className="text-xs font-medium text-gray-600 mb-2">
            Quick Select:
          </div>
          <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto p-1 bg-gray-50 rounded-lg">
            {popularEmojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleEmojiSelect(emoji, isNewTask)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white hover:scale-110 transition-all duration-200 ${
                  currentIcon === emoji
                    ? "bg-white ring-2 ring-cyan-400 scale-110"
                    : "bg-transparent"
                }`}
                title={`Select ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Custom emoji input */}
        <div>
          <div className="text-xs font-medium text-gray-600 mb-2">
            Custom Emoji:
          </div>
          <input
            type="text"
            value={currentIcon}
            onChange={(e) => handleEmojiSelect(e.target.value, isNewTask)}
            placeholder="Paste any emoji here..."
            className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-center text-2xl"
            maxLength={2}
          />
          <div className="text-xs text-gray-500 text-center mt-1">
            Enter any emoji character
          </div>
        </div>
      </div>
    );
  };

  // Notes input component
  const renderNotesInput = (isNewTask = true) => {
    const currentNotes = isNewTask ? newTask.notes : editTask.notes;

    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Short Notes (Points Form)
        </label>
        <textarea
          value={currentNotes}
          onChange={(e) => {
            if (isNewTask) {
              setNewTask({ ...newTask, notes: e.target.value });
            } else {
              setEditTask({ ...editTask, notes: e.target.value });
            }
          }}
          placeholder="Enter short notes in points form...
• Point 1
• Point 2
• Point 3"
          className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm min-h-[100px] resize-vertical"
          rows={4}
        />
        <div className="text-xs text-gray-500">
          Use bullet points for better readability. These notes will be shown
          when hovering over the active task.
        </div>
      </div>
    );
  };

  const summaryData = getSummaryData();

  return (
    <>
      <div
        id="app-container"
        className={`sunrise-bg ${isMinimized ? "minimized" : ""} ${
          isEditMode ? "edit-mode-active" : ""
        }`}
        style={{
          width: isMinimized ? "300px" : "400px",
          height: isMinimized ? "100px" : "600px",
          borderRadius: "24px",
          overflow: "hidden",
          zIndex: 1000,
        }}
      >
        {/* EXPANDED VIEW */}
        {!isMinimized && (
          <div id="expanded-view" className="flex flex-col gap-4 p-5 h-full">
            {/* Header - Reduced size */}
            <header className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-bold text-xl text-gray-800 truncate">
                    Daily Routines
                  </h1>
                </div>
                {isEditMode && (
                  <p className="text-xs text-yellow-700 font-medium">
                    Click on any task to edit or delete
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600 flex-shrink-0">
                {!isEditMode && (
                  <button
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors shadow-soft ${
                      isEditMode
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-cyan-500 hover:bg-cyan-600"
                    }`}
                    onClick={() => showModal("add")}
                    title="Add Task"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                )}
                <button
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-soft ${
                    isEditMode
                      ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={toggleEditMode}
                  title="Edit Tasks"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-gray-600 hover:bg-gray-50 shadow-soft transition-colors"
                  onClick={handleMinimizeToggle}
                  title="Minimize"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </header>
            {/* Current Task Block */}
            {renderActiveTask()}
            {/* Progress Section - Reduced size */}
            <div
              className={`bg-white rounded-xl p-3 shadow-soft ${
                isEditMode ? "ring-2 ring-yellow-400 ring-opacity-50" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700">
                  Daily Progress
                </span>
                <span className="text-xs text-gray-600">
                  {summaryData.completedCount}/{summaryData.totalTasks} tasks
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isEditMode
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                      : "bg-gradient-to-r from-cyan-400 to-cyan-600"
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            {/* Task List with Fixed Scroll */}
            <div className="flex-1 min-h-0 flex flex-col">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm flex-shrink-0">
                Today's Habits
                {isEditMode && (
                  <span className="text-xs font-normal text-yellow-600 ml-2">
                    • Click to edit
                  </span>
                )}
              </h3>
              <div className="flex-1 min-h-0 overflow-hidden" ref={taskListRef}>
                <div className="h-full overflow-y-auto custom-scrollbar pr-1 p-1">
                  <div className="space-y-2">{renderTaskList()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MINIMIZED VIEW */}
        {isMinimized && renderMinimizedView()}
      </div>

      {/* MODALS */}
      <div className={`modal-overlay ${activeModal ? "visible" : ""}`}>
        {activeModal === "add" && (
          <div className="modal-content bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800">Add New Habit</h2>
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  required
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  placeholder="e.g., Morning Meditation"
                />
              </div>

              {/* Emoji Picker */}
              {renderEmojiPicker(true)}

              {/* Notes Input */}
              {renderNotesInput(true)}

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newTask.startTime}
                    onChange={(e) =>
                      handleNewTaskTimeChange("startTime", e.target.value)
                    }
                    required
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>
                <div className="w-1/2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newTask.endTime}
                    onChange={(e) =>
                      handleNewTaskTimeChange("endTime", e.target.value)
                    }
                    required
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Time Conflict Error */}
              {timeConflictError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span className="text-sm font-medium">
                      {timeConflictError}
                    </span>
                  </div>
                </div>
              )}

              {/* Suggested Time Slots */}
              {tasks.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Suggested Time Slots:
                  </h4>
                  <div className="space-y-2">
                    {getSuggestedTimeSlots().map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => useSuggestedTime(slot.start, slot.end)}
                        className="w-full text-left p-2 bg-white rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-sm"
                      >
                        <div className="font-medium text-blue-700">
                          {formatTime(slot.start)} - {formatTime(slot.end)}
                        </div>
                        <div className="text-blue-600 text-xs">
                          {slot.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                  onClick={hideModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!timeConflictError}
                  className={`px-5 py-3 rounded-xl font-semibold transition-colors shadow-soft ${
                    timeConflictError
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-cyan-500 hover:bg-cyan-600 text-white"
                  }`}
                >
                  Add Habit
                </button>
              </div>
            </form>
          </div>
        )}

        {activeModal === "edit" && (
          <div className="modal-content bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800">Edit Habit</h2>
            <form onSubmit={handleEditTask} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Habit Name
                </label>
                <input
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  type="text"
                  value={editTask.title}
                  onChange={(e) =>
                    setEditTask({ ...editTask, title: e.target.value })
                  }
                />
              </div>

              {/* Emoji Picker */}
              {renderEmojiPicker(false)}

              {/* Notes Input */}
              {renderNotesInput(false)}

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Start Time
                  </label>
                  <input
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    type="time"
                    value={editTask.startTime}
                    onChange={(e) =>
                      handleEditTaskTimeChange("startTime", e.target.value)
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    End Time
                  </label>
                  <input
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    type="time"
                    value={editTask.endTime}
                    onChange={(e) =>
                      handleEditTaskTimeChange("endTime", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Time Conflict Error */}
              {timeConflictError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span className="text-sm font-medium">
                      {timeConflictError}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                  onClick={hideModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!timeConflictError}
                  className={`px-5 py-3 rounded-xl font-semibold transition-colors shadow-soft ${
                    timeConflictError
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-cyan-500 hover:bg-cyan-600 text-white"
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {isEditMode && !isMinimized && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-2 rounded-lg font-bold text-sm shadow-lg">
            🎯 Edit Mode Active
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingRoutineManager;
