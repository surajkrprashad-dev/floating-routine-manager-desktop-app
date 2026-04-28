// Create memoized event handlers to prevent recreation on each render
const TaskCard = React.memo(
  ({
    icon,
    title,
    startTime,
    endTime,
    progressLabel,
    iconColor,
    ringColor,
    textColor = "text-gray-800",
    bgColor = "bg-white",
    isCompleted = false,
    onComplete,
    onReset,
    onClick,
    isEditMode,
    isCurrent = false,
    className = "",
  }) => {
    // Memoize click handler
    const handleClick = React.useCallback(
      (e) => {
        e?.stopPropagation?.();
        onClick?.();
      },
      [onClick]
    );

    // Memoize complete handler
    const handleComplete = React.useCallback(
      (e) => {
        e.stopPropagation();
        if (isCompleted) {
          onReset?.();
        } else {
          onComplete?.();
        }
      },
      [isCompleted, onComplete, onReset]
    );

    // Memoize reset handler for edit mode
    const handleEditModeReset = React.useCallback(
      (e) => {
        e.stopPropagation();
        onReset?.();
      },
      [onReset]
    );

    return (
      <div
        className={`p-2 rounded-2xl ${bgColor} ring-2 ${
          isCurrent
            ? "ring-cyan-400 shadow-md"
            : isCompleted
            ? "ring-green-400"
            : "ring-gray-200"
        } ${className}`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br ${iconColor}`}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold truncate ${textColor}`}>{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600">{startTime}</span>
                <span className="text-xs text-gray-600">-</span>
                <span className="text-xs text-gray-600">{endTime}</span>
                {isCompleted && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 rounded-full font-medium">
                    Completed
                  </span>
                )}
                {isCurrent && (
                  <span className="text-xs bg-cyan-100 text-cyan-700 px-2 rounded-full font-medium">
                    Current
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Radio Button for task status */}
          {!isEditMode && (
            <div className="flex items-center ml-2">
              <div className="relative">
                <div
                  onClick={handleComplete}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                    isCompleted
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300 hover:border-green-400"
                  }`}
                  title={
                    isCompleted ? "Mark as incomplete" : "Mark as completed"
                  }
                ></div>
              </div>
            </div>
          )}

          {/* Reset Button for edit mode */}
          {isCompleted && isEditMode && (
            <button
              onClick={handleEditModeReset}
              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 shadow-sm ml-2"
              title="Reset task"
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
                <path d="M3 2v6h6"></path>
                <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
                <path d="M21 22v-6h-6"></path>
                <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  },
  // Custom comparison function for React.memo
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.icon === nextProps.icon &&
      prevProps.title === nextProps.title &&
      prevProps.startTime === nextProps.startTime &&
      prevProps.endTime === nextProps.endTime &&
      prevProps.iconColor === nextProps.iconColor &&
      prevProps.textColor === nextProps.textColor &&
      prevProps.bgColor === nextProps.bgColor &&
      prevProps.isCompleted === nextProps.isCompleted &&
      prevProps.isCurrent === nextProps.isCurrent &&
      prevProps.isEditMode === nextProps.isEditMode &&
      prevProps.className === nextProps.className
    );
  }
);

export default TaskCard;
