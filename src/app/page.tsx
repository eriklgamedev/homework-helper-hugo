"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Task {
  id: string;
  text: string;
  subject?: string;
  completed: boolean;
  date: string;
  recurring?: boolean;
  queued?: boolean;
}

const STORAGE_KEY = "homework-helper-v2";

const translations = {
  en: {
    title: "Homework Helper",
    subtitle: "Scan homework, crush it task by task!",
    scanHomework: "Scan Homework",
    scanHint: "Take a photo or upload a screenshot",
    reading: "Reading your homework...",
    placeholder: "Add a task...",
    placeholderDaily: "Add daily routine...",
    placeholderQueue: "Add to queue...",
    of: "of",
    done: "done",
    allDone: "All done! 🎉",
    noTasks: "No tasks yet",
    noTasksHint: "Scan homework or type a task below",
    clearCompleted: "Clear completed",
    checkAll: "Check all",
    uncheckAll: "Uncheck all",
    couldNotRead: "Couldn't read the image. Please try again!",
    daily: "Daily Routines",
    dailyHint: "Resets every day",
    assignments: "Assignments",
    queue: "Queue",
    queueHint: "Not counted in progress",
    today: "Today",
    earlier: "Earlier",
    lastScan: "Last scan",
    extracted: "Tasks extracted",
    modeTask: "Task",
    modeDaily: "Daily",
    modeQueue: "Queue",
  },
  zh: {
    title: "作业助手",
    subtitle: "扫描作业，逐个击破！",
    scanHomework: "扫描作业",
    scanHint: "拍照或上传截图",
    reading: "正在识别...",
    placeholder: "添加任务...",
    placeholderDaily: "添加每日常规...",
    placeholderQueue: "添加到队列...",
    of: "/",
    done: "已完成",
    allDone: "全部完成！🎉",
    noTasks: "暂无任务",
    noTasksHint: "扫描作业或在下方输入任务",
    clearCompleted: "清除已完成",
    checkAll: "全选",
    uncheckAll: "取消全选",
    couldNotRead: "无法识别图片，请重试！",
    daily: "每日常规",
    dailyHint: "每天自动重置",
    assignments: "今日作业",
    queue: "任务队列",
    queueHint: "不计入进度",
    today: "今天",
    earlier: "之前",
    lastScan: "上次扫描",
    extracted: "已提取任务",
    modeTask: "作业",
    modeDaily: "每日",
    modeQueue: "队列",
  },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const subjectColorMap: Record<string, { border: string; bg: string; text: string }> = {
  math:    { border: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  数学:    { border: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  reading: { border: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  阅读:    { border: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  语文:    { border: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  science: { border: "#a855f7", bg: "#faf5ff", text: "#6b21a8" },
  科学:    { border: "#a855f7", bg: "#faf5ff", text: "#6b21a8" },
  writing: { border: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  写作:    { border: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  作文:    { border: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  spelling:{ border: "#ec4899", bg: "#fdf2f8", text: "#9d174d" },
  拼写:    { border: "#ec4899", bg: "#fdf2f8", text: "#9d174d" },
  history: { border: "#eab308", bg: "#fefce8", text: "#713f12" },
  历史:    { border: "#eab308", bg: "#fefce8", text: "#713f12" },
  art:     { border: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  美术:    { border: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  music:   { border: "#6366f1", bg: "#eef2ff", text: "#3730a3" },
  音乐:    { border: "#6366f1", bg: "#eef2ff", text: "#3730a3" },
  english: { border: "#06b6d4", bg: "#ecfeff", text: "#164e63" },
  英语:    { border: "#06b6d4", bg: "#ecfeff", text: "#164e63" },
};

const DEFAULT_COLOR = { border: "#8b5cf6", bg: "#f5f3ff", text: "#5b21b6" };

function getSubjectColor(subject?: string) {
  if (!subject) return DEFAULT_COLOR;
  return subjectColorMap[subject.toLowerCase()] ?? subjectColorMap[subject] ?? DEFAULT_COLOR;
}

// ─── TaskCard ────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  index,
  bouncing,
  dragging,
  dragOver,
  onToggle,
  onRemove,
  onDragStart,
  onDragEnter,
  onDrop,
}: {
  task: Task;
  index: number;
  bouncing: boolean;
  dragging: boolean;
  dragOver: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDrop: () => void;
}) {
  const color = getSubjectColor(task.subject);
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragEnter={() => onDragEnter(task.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onDragEnd={onDrop}
      className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 transition-all active:scale-[0.985] cursor-grab active:cursor-grabbing"
      style={{
        animation: dragging ? "none" : `slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.04}s both`,
        borderLeft: `4px solid ${task.completed ? "#e5e7eb" : color.border}`,
        opacity: dragging ? 0.4 : 1,
        outline: dragOver ? "2px dashed #8b5cf6" : "none",
        outlineOffset: dragOver ? "2px" : "0",
        transform: dragOver ? "scale(1.02)" : undefined,
      }}
    >
      {/* Drag handle */}
      <div className="shrink-0 text-gray-300 touch-none select-none">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 active:scale-90 ${
          task.completed
            ? "border-transparent bg-emerald-400 shadow-md shadow-emerald-200"
            : "border-gray-300 hover:border-violet-400 hover:bg-violet-50"
        }`}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        {task.completed && (
          <svg
            className="h-5 w-5 text-white"
            style={{ animation: bouncing ? "checkBounce 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both" : undefined }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Text + subject */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug transition-all duration-300 ${task.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>
          {task.text}
        </p>
        {task.subject && (
          <span
            className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {task.subject}
          </span>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(task.id)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-300 transition-all hover:bg-red-50 hover:text-red-400 active:scale-90"
        aria-label="Remove task"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mt-12 flex flex-col items-center gap-3 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-50">
        <svg className="h-10 w-10 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      </div>
      <p className="text-base font-semibold text-gray-500">{title}</p>
      <p className="text-sm text-gray-400">{hint}</p>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [mode, setMode] = useState<"task" | "daily" | "queue">("task");
  const [lang, setLang] = useState<"en" | "zh">("zh");
  const [bouncingIds, setBouncingIds] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];
  const today = todayStr();

  // ── Persist + daily reset ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        let loadedTasks: Task[] = saved.tasks ?? [];
        if ((saved.lastResetDate ?? "") !== today) {
          loadedTasks = loadedTasks.map((t) =>
            t.recurring ? { ...t, completed: false } : t
          );
        }
        setTasks(loadedTasks);
        if (saved.lang) setLang(saved.lang as "en" | "zh");
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, [today]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, lang, lastResetDate: today }));
    } catch { /* ignore */ }
  }, [tasks, lang, today, hydrated]);

  // ── Drag & drop ──────────────────────────────────────────────────────────
  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragEnter = (id: string) => setDragOverId(id);
  const handleDrop = useCallback(() => {
    if (draggingId && dragOverId && draggingId !== dragOverId) {
      setTasks((prev) => {
        const arr = [...prev];
        const fromIdx = arr.findIndex((t) => t.id === draggingId);
        const toIdx = arr.findIndex((t) => t.id === dragOverId);
        if (fromIdx < 0 || toIdx < 0) return prev;
        const [item] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, item);
        return arr;
      });
    }
    setDraggingId(null);
    setDragOverId(null);
  }, [draggingId, dragOverId]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const addManualTask = () => {
    const text = newTaskText.trim();
    if (!text) return;
    setTasks((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        text,
        completed: false,
        date: today,
        recurring: mode === "daily",
        queued: mode === "queue",
      },
    ]);
    setNewTaskText("");
    inputRef.current?.focus();
  };

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      // Convert to base64 for API
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const dataUrl = `data:${file.type};base64,${btoa(binary)}`;

      setLoading(true);
      try {
        const res = await fetch("/api/extract-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl, lang }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const newTasks: Task[] = data.tasks.map(
          (item: { text: string; subject?: string }, i: number) => ({
            id: `${Date.now()}-${i}`,
            text: item.text,
            subject: item.subject,
            completed: false,
            date: today,
          })
        );
        setTasks((prev) => [...prev, ...newTasks]);
      } catch {
        setError(t.couldNotRead);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [lang, today, t.couldNotRead]
  );

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const completing = !task.completed;
        if (completing) {
          setBouncingIds((s) => new Set([...s, id]));
          setTimeout(() => setBouncingIds((s) => { const n = new Set(s); n.delete(id); return n; }), 500);
        }
        return { ...task, completed: completing };
      })
    );
  };

  const removeTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const clearCompleted = () =>
    setTasks((prev) => prev.filter((t) => t.recurring || t.queued || !t.completed));

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeTasks   = tasks.filter((t) => !t.queued);
  const queuedTasks   = tasks.filter((t) => t.queued);
  const dailyTasks    = activeTasks.filter((t) => t.recurring);
  const oneOffTasks   = activeTasks.filter((t) => !t.recurring);
  const todayTasks    = oneOffTasks.filter((t) => t.date === today);
  const earlierTasks  = oneOffTasks.filter((t) => t.date < today);

  // Progress excludes queued tasks
  const completedCount = activeTasks.filter((t) => t.completed).length;
  const totalCount     = activeTasks.length;
  const progress       = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allChecked     = totalCount > 0 && completedCount === totalCount;
  const allDone        = allChecked;

  const checkAll   = () => setTasks((prev) => prev.map((t) => t.queued ? t : { ...t, completed: true }));
  const uncheckAll = () => setTasks((prev) => prev.map((t) => t.queued ? t : { ...t, completed: false }));

  const taskCardProps = (task: Task, i: number) => ({
    task,
    index: i,
    bouncing: bouncingIds.has(task.id),
    dragging: draggingId === task.id,
    dragOver: dragOverId === task.id,
    onToggle: toggleTask,
    onRemove: removeTask,
    onDragStart: handleDragStart,
    onDragEnter: handleDragEnter,
    onDrop: handleDrop,
  });

  const inputPlaceholder =
    mode === "daily" ? t.placeholderDaily :
    mode === "queue" ? t.placeholderQueue :
    t.placeholder;

  const addButtonStyle = {
    task:  { bg: "linear-gradient(135deg, #7c3aed, #4f46e5)", shadow: "rgba(124,58,237,0.35)" },
    daily: { bg: "linear-gradient(135deg, #059669, #10b981)", shadow: "rgba(16,185,129,0.35)" },
    queue: { bg: "linear-gradient(135deg, #d97706, #f59e0b)", shadow: "rgba(217,119,6,0.35)" },
  }[mode];

  if (!hydrated) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkBounce {
          0%   { transform: scale(0) rotate(-15deg); }
          55%  { transform: scale(1.3) rotate(8deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.22); opacity: 0; }
        }
        @keyframes celebrate {
          0%, 100% { transform: scale(1) rotate(0deg); }
          20%      { transform: scale(1.06) rotate(-2deg); }
          50%      { transform: scale(1.06) rotate(2deg); }
          75%      { transform: scale(1.02) rotate(-1deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .pulse-ring {
          position: absolute; inset: -6px; border-radius: inherit;
          border: 2px solid #8b5cf6;
          animation: pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          pointer-events: none;
        }
        .all-done { animation: celebrate 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      <main className="flex flex-col bg-gradient-to-b from-violet-50 via-white to-amber-50" style={{ minHeight: "100dvh" }}>
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "8rem" }}>
          <div className="mx-auto max-w-lg px-4 pt-6 pb-2">

            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 8px 20px rgba(124,58,237,0.3)" }}
                >
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold leading-none text-gray-900">{t.title}</h1>
                  <p className="mt-0.5 text-xs text-gray-400">{t.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setLang((l) => (l === "en" ? "zh" : "en"))}
                className="flex h-10 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:border-violet-300 hover:text-violet-600 active:scale-95"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                </svg>
                {lang === "en" ? "中文" : "EN"}
              </button>
            </div>

            {/* Scan button */}
            <div className="mb-4">
              <label
                htmlFor="image-upload"
                className={`relative flex cursor-pointer items-center justify-center gap-4 overflow-visible rounded-2xl p-5 transition-all active:scale-[0.97] ${
                  loading ? "border-2 border-violet-200 bg-violet-50" : ""
                }`}
                style={loading ? {} : { background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", boxShadow: "0 10px 30px rgba(124,58,237,0.35)" }}
              >
                {!loading && <div className="pulse-ring" style={{ borderRadius: "1rem" }} />}
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full" style={{ border: "3px solid #ddd6fe", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
                    <span className="font-semibold text-violet-600">{t.reading}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">{t.scanHomework}</p>
                      <p className="text-xs text-white/70">{t.scanHint}</p>
                    </div>
                  </>
                )}
              </label>
              <input ref={fileInputRef} id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={loading} />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Preview */}
            {preview && !loading && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm">
                <img src={preview} alt="Homework preview" className="h-14 w-14 rounded-xl border border-gray-100 object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-400">{t.lastScan}</p>
                  <p className="text-sm font-semibold text-gray-700">{t.extracted}</p>
                </div>
                <button onClick={() => setPreview(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-all active:scale-90">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Progress card — active tasks only */}
            {totalCount > 0 && (
              <div className={`mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${allDone ? "all-done" : ""}`}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{completedCount}</span>
                    <span className="text-sm text-gray-400">{t.of} {totalCount} {t.done}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {allDone && <span className="text-sm font-bold text-violet-600">{t.allDone}</span>}
                    <button
                      onClick={allChecked ? uncheckAll : checkAll}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 active:scale-95"
                    >
                      {allChecked ? t.uncheckAll : t.checkAll}
                    </button>
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${progress}%`,
                      background: allDone ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #7c3aed, #6366f1)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* ── Sections ── */}
            {tasks.length === 0 ? (
              <EmptyState title={t.noTasks} hint={t.noTasksHint} />
            ) : (
              <div className="space-y-6">

                {/* Daily routines */}
                {dailyTasks.length > 0 && (
                  <section>
                    <div className="mb-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🔁</span>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">{t.daily}</p>
                      </div>
                      <span className="text-xs text-gray-400">{t.dailyHint}</span>
                    </div>
                    <div className="space-y-2.5">
                      {dailyTasks.map((task, i) => (
                        <TaskCard key={task.id} {...taskCardProps(task, i)} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Today's assignments */}
                {todayTasks.length > 0 && (
                  <section>
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className="text-base">📝</span>
                      <p className="text-xs font-bold uppercase tracking-wider text-violet-500">{t.assignments}</p>
                    </div>
                    <div className="space-y-2.5">
                      {todayTasks.map((task, i) => (
                        <TaskCard key={task.id} {...taskCardProps(task, i)} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Earlier assignments */}
                {earlierTasks.length > 0 && (
                  <section>
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className="text-base">🗂️</span>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{t.earlier}</p>
                    </div>
                    <div className="space-y-2.5">
                      {earlierTasks.map((task, i) => (
                        <TaskCard key={task.id} {...taskCardProps(task, i)} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Clear completed */}
                {activeTasks.some((t) => t.completed) && (
                  <button
                    onClick={clearCompleted}
                    className="w-full rounded-2xl py-3 text-sm font-semibold text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 active:scale-[0.98]"
                  >
                    {t.clearCompleted} ({activeTasks.filter((t) => t.completed).length})
                  </button>
                )}

                {/* ── Queue section ── */}
                {queuedTasks.length > 0 && (
                  <section>
                    <div className="mb-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🗃️</span>
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-500">{t.queue}</p>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-600">
                          {queuedTasks.length}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{t.queueHint}</span>
                    </div>
                    <div
                      className="space-y-2.5 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-3"
                      onDragOver={(e) => e.preventDefault()}
                    >
                      {queuedTasks.map((task, i) => (
                        <TaskCard key={task.id} {...taskCardProps(task, i)} />
                      ))}
                    </div>
                  </section>
                )}

              </div>
            )}

            {/* Empty queue drop hint when queue is empty */}
            {queuedTasks.length === 0 && tasks.length > 0 && (
              <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/30 py-4 text-xs text-amber-400">
                <span>🗃️</span>
                <span>{t.modeQueue} — {t.queueHint}</span>
              </div>
            )}

          </div>
        </div>

        {/* ── Bottom sticky input ── */}
        <div
          className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white/95 px-4 pt-3"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="mx-auto max-w-lg space-y-2">
            {/* Mode toggle */}
            <div className="flex gap-1 rounded-full border border-gray-200 bg-gray-100 p-1 w-fit">
              {(["task", "daily", "queue"] as const).map((m) => {
                const labels = { task: `📝 ${t.modeTask}`, daily: `🔁 ${t.modeDaily}`, queue: `🗃️ ${t.modeQueue}` };
                const activeColors = {
                  task:  "text-violet-600",
                  daily: "text-emerald-600",
                  queue: "text-amber-600",
                };
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      mode === m
                        ? `bg-white shadow-sm ${activeColors[m]}`
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {labels[m]}
                  </button>
                );
              })}
            </div>

            {/* Input row */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManualTask()}
                placeholder={inputPlaceholder}
                className="flex-1 rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-4"
                style={{
                  borderColor: mode === "daily" ? "#6ee7b7" : mode === "queue" ? "#fcd34d" : "#e5e7eb",
                  "--tw-ring-color": mode === "daily" ? "rgb(209 250 229)" : mode === "queue" ? "rgb(254 243 199)" : "rgb(237 233 254)",
                } as React.CSSProperties}
              />
              <button
                onClick={addManualTask}
                disabled={!newTaskText.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white transition-all active:scale-90 disabled:opacity-30"
                style={{
                  background: newTaskText.trim() ? addButtonStyle.bg : "#e5e7eb",
                  boxShadow: newTaskText.trim() ? `0 6px 16px ${addButtonStyle.shadow}` : "none",
                }}
                aria-label="Add task"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
