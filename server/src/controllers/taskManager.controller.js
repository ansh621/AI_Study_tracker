const Task = require("../DB/Model/task.model");
async function deleteTask(req, res) {
    try {
        // We get the ID from the URL parameters: /api/tasks/64a123...
        const { taskId } = req.params;

        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ message: "Task removed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting task" });
    }
}