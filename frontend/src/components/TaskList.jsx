import TaskItem from "./TaskItem";

function TaskList({ tasks, deleteTask, toggleTask, editTask }) {
    if (tasks.length === 0) {
        return (
            <p className="text-center text-gray-400 text-sm py-8">
                No tasks here yet.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {tasks.map((task) => (
                <TaskItem
                    key={task.id}
                    task={task}
                    deleteTask={deleteTask}
                    toggleTask={toggleTask}
                    editTask={editTask}
                />
            ))}
        </div>
    );
}

export default TaskList;