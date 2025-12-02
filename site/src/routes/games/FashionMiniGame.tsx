// FashionMiniGame.tsx
import React, { useState } from 'react';


const themes = ['Party', 'Cozy Day', 'School', 'Date Night'];


const FashionMiniGame: React.FC<{ onComplete: (coins: number) => void }> = ({ onComplete }) => {
const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
const [completed, setCompleted] = useState(false);


function handlePlay() {
if (selectedTheme) {
setCompleted(true);
onComplete(20); // 20 coins reward
}
}


return (
<div className="p-4">
<h2 className="text-xl font-bold">Pick a Theme</h2>
<div className="my-4 grid grid-cols-2 gap-2">
{themes.map(theme => (
<button
key={theme}
className={`p-2 border rounded ${selectedTheme === theme ? 'bg-blue-100' : ''}`}
onClick={() => setSelectedTheme(theme)}
>
{theme}
</button>
))}
</div>
<button
disabled={!selectedTheme || completed}
onClick={handlePlay}
className="bg-green-500 text-white px-4 py-2 rounded"
>
Play
</button>
</div>
);
};


export default FashionMiniGame;