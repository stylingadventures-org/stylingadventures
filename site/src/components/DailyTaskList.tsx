// DailyTaskList.tsx
import React from 'react';
import { getDailyTasks } from '../logic/dailyTaskLogic';


const DailyTaskList: React.FC<{ onTaskComplete: (taskId: string, coins: number) => void }> = ({ onTaskComplete }) => {
const tasks = getDailyTasks();


return (
<div className="p-4 bg-white rounded shadow-md">
<h2 className="text-xl font-bold mb-2">Today's Tasks</h2>
<ul className="space-y-2">
{tasks.map(task => (
<li key={task.id} className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded">
<span>{task.label}</span>
<button
className="bg-yellow-400 text-white px-3 py-1 rounded"
onClick={() => onTaskComplete(task.id, task.coins)}
>
+{task.coins} Coins
</button>
</li>
))}
</ul>
</div>
);
};


export default DailyTaskList;