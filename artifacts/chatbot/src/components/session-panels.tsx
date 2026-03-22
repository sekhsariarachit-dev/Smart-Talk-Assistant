import React, { useState, useEffect, useCallback } from "react";
import { X, Plus, Trash2, CheckSquare, Square, NotebookPen, ListTodo, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

interface NotebookPanelProps {
  sessionId: string;
  onClose: () => void;
}

export function NotebookPanel({ sessionId, onClose }: NotebookPanelProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimer = React.useRef<any>(null);

  useEffect(() => {
    fetch(`/api/session/notes/${sessionId}`)
      .then(r => r.json())
      .then(data => setContent(data.content || ""))
      .catch(() => {});
  }, [sessionId]);

  const save = useCallback(async (text: string) => {
    setSaving(true);
    try {
      await fetch(`/api/session/notes/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      setLastSaved(new Date());
    } catch {}
    setSaving(false);
  }, [sessionId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(e.target.value), 1000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <NotebookPen size={18} />
          <span className="font-semibold">Notebook</span>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin text-gray-400" />}
          {lastSaved && !saving && <span className="text-xs text-gray-400">Saved</span>}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={16} />
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Write your notes here... Notes auto-save as you type."
        className="flex-1 p-4 text-sm resize-none focus:outline-none text-gray-800 placeholder:text-gray-400"
      />
    </div>
  );
}

interface ProjectPanelProps {
  sessionId: string;
  onClose: () => void;
}

export function ProjectPanel({ sessionId, onClose }: ProjectPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/session/tasks/${sessionId}`)
      .then(r => r.json())
      .then(data => setTasks(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const res = await fetch(`/api/session/tasks/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask.trim() }),
      });
      const task = await res.json();
      setTasks(prev => [...prev, task]);
      setNewTask("");
    } catch {}
  };

  const toggleTask = async (task: Task) => {
    try {
      const res = await fetch(`/api/session/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch {}
  };

  const deleteTask = async (taskId: number) => {
    try {
      await fetch(`/api/session/tasks/${taskId}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch {}
  };

  const completed = tasks.filter(t => t.completed).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <ListTodo size={18} />
          <span className="font-semibold">Project Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          {tasks.length > 0 && <span className="text-xs text-gray-400">{completed}/{tasks.length}</span>}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={16} />
          </button>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="h-1 bg-gray-100 shrink-0">
          <div className="h-full bg-black transition-all" style={{ width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%` }} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {loading ? (
          <div className="flex justify-center pt-8"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
        ) : tasks.length === 0 ? (
          <p className="text-center text-sm text-gray-400 pt-8">No tasks yet. Add your first task below.</p>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 group">
              <button onClick={() => toggleTask(task)} className="shrink-0 mt-0.5 text-gray-400 hover:text-black">
                {task.completed ? <CheckSquare size={18} className="text-black" /> : <Square size={18} />}
              </button>
              <span className={cn("flex-1 text-sm", task.completed && "line-through text-gray-400")}>{task.title}</span>
              <button
                onClick={() => deleteTask(task.id)}
                className="shrink-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t shrink-0">
        <div className="flex gap-2">
          <input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTask()}
            placeholder="Add a task..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
          <button
            onClick={addTask}
            disabled={!newTask.trim()}
            className="p-2 bg-black text-white rounded-xl hover:bg-gray-900 disabled:opacity-40 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
