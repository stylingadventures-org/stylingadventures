// useDailyTasks.ts
import { useState } from 'react';


export function useDailyTasks() {
const [completedTasks, setCompletedTasks] = useState<string[]>([]);


function completeTask(taskId: string) {
if (!completedTasks.includes(taskId)) {
setCompletedTasks([...completedTasks, taskId]);
}
}


return {
completedTasks,
completeTask,
};
}