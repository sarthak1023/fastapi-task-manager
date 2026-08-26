import { useState } from "react";
import Tilt from "react-parallax-tilt";
import { Check, Pencil, Trash2, X, Save } from "lucide-react";

function TaskItem({ task, deleteTask, toggleTask, editTask }) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || "");

    function handleSave() {
        editTask(task.id, title, description);
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <div className="bg-white rounded-2xl p-4 space-y-2 shadow-lg">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                    <button onClick={handleSave} className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition">
                        <Save size={14} /> Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
                        <X size={14} /> Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Tilt
            tiltMaxAngleX={8}
            tiltMaxAngleY={8}
            glareEnable={true}
            glareMaxOpacity={0.15}
            glareColor="#ffffff"
            glarePosition="all"
            scale={1.02}
            transitionSpeed={1500}
            className="rounded-2xl"
        >
            <div className="bg-white rounded-2xl p-4 shadow-lg flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${task.completed ? "bg-emerald-500" : "bg-amber-400"}`} />
                        <h3 className={`font-medium ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                            {task.title}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 break-words pl-4">
                        {task.description}
                    </p>
                </div>

                <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => toggleTask(task.id)} title="Toggle complete" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition">
                        <Check size={16} />
                    </button>
                    <button onClick={() => setIsEditing(true)} title="Edit" className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition">
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => deleteTask(task.id)} title="Delete" className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </Tilt>
    );
}

export default TaskItem;