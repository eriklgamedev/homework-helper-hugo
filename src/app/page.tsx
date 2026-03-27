"use client";

import { useState, useRef, useCallback } from "react";

interface Task {
  id: string;
  text: string;
  subject?: string;
  completed: boolean;
  date: string; // ISO date string YYYY-MM-DD
}

const translations = {
  en: {
    title: "Homework Helper",
    subtitle: "Take a photo of your homework and check off tasks as you go!",
    tapPhoto: "Tap to take a photo",
    orUpload: "or upload a screenshot",
    reading: "Reading your homework...",
    placeholder: "Type a task...",
    of: "of",
    done: "done",
    allDone: "All done! 🎉",
    noTasks: "No tasks yet",
    noTasksHint: "Take a photo or type a task to get started!",
    clearCompleted: "Clear completed tasks",
    checkAll: "Check all",
    uncheckAll: "Uncheck all",
    couldNotRead: "Could not read the image. Please try again!",
    tabAll: "All Tasks",
    tabToday: "Today",
    noTodayTasks: "No tasks for today",
    noTodayHint: "Add a task or scan homework to add something here.",
    today: "Today",
    earlier: "Earlier",
  },
  zh: {
    title: "作业助手",
    subtitle: "拍一张作业的照片，逐一勾选完成的任务！",
    tapPhoto: "点击拍照",
    orUpload: "或上传截图",
    reading: "正在识别作业...",
    placeholder: "输入任务...",
    of: "/",
    done: "已完成",
    allDone: "全部完成！🎉",
    noTasks: "暂无任务",
    noTasksHint: "拍照或手动输入任务即可开始！",
    clearCompleted: "清除已完成的任务",
    checkAll: "全选",
    uncheckAll: "取消全选",
    couldNotRead: "无法识别图片，请重试！",
    tabAll: "全部任务",
    tabToday: "今日",
    noTodayTasks: "今日暂无任务",
    noTodayHint: "添加任务或扫描作业来添加内容。",
    today: "今天",
    earlier: "之前",
  },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [tab, setTab] = useState<"all" | "today">("today");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];
  const today = todayStr();

  const addManualTask = () => {
    const text = newTaskText.trim();
    if (!text) return;
    setTasks((prev) => [
      ...prev,
      { id: `${Date.now()}`, text, completed: false, date: today },
    ]);
    setNewTaskText("");
    inputRef.current?.focus();
  };

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);

      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);

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
          (t: { text: string; subject?: string }, i: number) => ({
            id: `${Date.now()}-${i}`,
            text: t.text,
            subject: t.subject,
            completed: false,
            date: today,
          })
        );
        setTasks((prev) => [...prev, ...newTasks]);
      } catch {
        setError(translations[lang].couldNotRead);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [lang, today]
  );

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const removeTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  const clearCompleted = () =>
    setTasks((prev) => prev.filter((t) => !t.completed));

  const subjectColors: Record<string, string> = {
    math: "bg-blue-100 text-blue-700",
    数学: "bg-blue-100 text-blue-700",
    reading: "bg-green-100 text-green-700",
    阅读: "bg-green-100 text-green-700",
    science: "bg-purple-100 text-purple-700",
    科学: "bg-purple-100 text-purple-700",
    writing: "bg-orange-100 text-orange-700",
    写作: "bg-orange-100 text-orange-700",
    spelling: "bg-pink-100 text-pink-700",
    拼写: "bg-pink-100 text-pink-700",
    history: "bg-yellow-100 text-yellow-700",
    历史: "bg-yellow-100 text-yellow-700",
    art: "bg-red-100 text-red-700",
    美术: "bg-red-100 text-red-700",
    music: "bg-indigo-100 text-indigo-700",
    音乐: "bg-indigo-100 text-indigo-700",
  };

  const getSubjectStyle = (subject?: string) => {
    if (!subject) return "bg-gray-100 text-gray-600";
    return subjectColors[subject.toLowerCase()] ?? subjectColors[subject] ?? "bg-gray-100 text-gray-600";
  };

  // Filtered task list based on active tab
  const displayedTasks = tab === "today" ? tasks.filter((t) => t.date === today) : tasks;
  const displayedTaskIds = new Set(displayedTasks.map((t) => t.id));
  const completedCount = displayedTasks.filter((t) => t.completed).length;
  const totalCount = displayedTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allChecked = totalCount > 0 && completedCount === totalCount;

  const checkAll = () =>
    setTasks((prev) =>
      prev.map((task) => (displayedTaskIds.has(task.id) ? { ...task, completed: true } : task))
    );

  const uncheckAll = () =>
    setTasks((prev) =>
      prev.map((task) => (displayedTaskIds.has(task.id) ? { ...task, completed: false } : task))
    );

  // For "All" tab, group by date
  const todayTasks = tasks.filter((t) => t.date === today);
  const earlierTasks = tasks.filter((t) => t.date !== today);

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-all ${
        task.completed ? "border-green-200 bg-green-50" : "border-gray-200 bg-white shadow-sm"
      }`}
    >
      <button
        onClick={() => toggleTask(task.id)}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          task.completed ? "border-green-400 bg-green-400 text-white" : "border-gray-300 hover:border-sky-400"
        }`}
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {task.completed && (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-base leading-snug ${task.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>
          {task.text}
        </p>
        {task.subject && (
          <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getSubjectStyle(task.subject)}`}>
            {task.subject}
          </span>
        )}
      </div>
      <button
        onClick={() => removeTask(task.id)}
        className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
        aria-label="Remove task"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-amber-50 p-4 sm:p-8">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-sky-600 mb-1">{t.title}</h1>
            <p className="text-gray-500 text-sm">{t.subtitle}</p>
          </div>
          <button
            onClick={() => setLang((l) => (l === "en" ? "zh" : "en"))}
            className="ml-4 mt-1 shrink-0 rounded-xl border-2 border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-sky-600 transition-colors hover:border-sky-400 hover:bg-sky-50"
          >
            {lang === "en" ? "中文" : "EN"}
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-xl bg-gray-100 p-1">
          {(["today", "all"] as const).map((tabId) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                tab === tabId ? "bg-white text-sky-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tabId === "today" ? t.tabToday : t.tabAll}
              {tabId === "today" && todayTasks.length > 0 && (
                <span className={`ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  tab === "today" ? "bg-sky-100 text-sky-600" : "bg-gray-200 text-gray-500"
                }`}>
                  {todayTasks.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Upload Area */}
        <div className="mb-4">
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all ${
              loading ? "border-amber-300 bg-amber-50" : "border-sky-300 bg-white hover:border-sky-400 hover:bg-sky-50"
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-sky-200 border-t-sky-500" />
                <span className="text-sky-600 font-medium">{t.reading}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                <div>
                  <p className="text-sky-600 font-semibold">{t.tapPhoto}</p>
                  <p className="text-gray-400 text-xs">{t.orUpload}</p>
                </div>
              </div>
            )}
          </label>
          <input ref={fileInputRef} id="image-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} disabled={loading} />
        </div>

        {/* Manual task input */}
        <div className="mb-5 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addManualTask()}
            placeholder={t.placeholder}
            className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-sky-400 focus:outline-none"
          />
          <button
            onClick={addManualTask}
            disabled={!newTaskText.trim()}
            className="rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-sky-600 disabled:opacity-40"
            aria-label="Add task"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-center text-red-600 text-sm">{error}</div>
        )}

        {/* Preview thumbnail */}
        {preview && (
          <div className="mb-5 flex justify-center">
            <img src={preview} alt="Uploaded homework" className="h-20 rounded-xl border-2 border-sky-200 object-cover shadow-sm" />
          </div>
        )}

        {/* Progress bar + check/uncheck all */}
        {totalCount > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                {completedCount} {t.of} {totalCount} {t.done}
              </span>
              <div className="flex items-center gap-2">
                {completedCount === totalCount && (
                  <span className="text-sm font-bold text-green-600">{t.allDone}</span>
                )}
                <button
                  onClick={allChecked ? uncheckAll : checkAll}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 hover:border-sky-300 hover:text-sky-600 transition-colors"
                >
                  {allChecked ? t.uncheckAll : t.checkAll}
                </button>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-green-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* TODAY TAB */}
        {tab === "today" && (
          <>
            {displayedTasks.length > 0 ? (
              <div className="space-y-3">
                {displayedTasks.map((task) => <TaskCard key={task.id} task={task} />)}
              </div>
            ) : (
              <div className="mt-8 text-center text-gray-400">
                <p className="text-lg">{t.noTodayTasks}</p>
                <p className="text-sm mt-1">{t.noTodayHint}</p>
              </div>
            )}
          </>
        )}

        {/* ALL TAB — grouped by date */}
        {tab === "all" && (
          <>
            {tasks.length === 0 ? (
              <div className="mt-8 text-center text-gray-400">
                <p className="text-lg">{t.noTasks}</p>
                <p className="text-sm mt-1">{t.noTasksHint}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {todayTasks.length > 0 && (
                  <div>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{t.today}</h2>
                    <div className="space-y-3">
                      {todayTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                    </div>
                  </div>
                )}
                {earlierTasks.length > 0 && (
                  <div>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{t.earlier}</h2>
                    <div className="space-y-3">
                      {earlierTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Clear completed */}
        {completedCount > 0 && (
          <button
            onClick={clearCompleted}
            className="mt-4 w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-200 transition-colors"
          >
            {t.clearCompleted}
          </button>
        )}
      </div>
    </main>
  );
}
