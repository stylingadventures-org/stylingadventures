// CoinCounter.tsx
import React from 'react';


interface CoinCounterProps {
coins: number;
}


const CoinCounter: React.FC<CoinCounterProps> = ({ coins }) => {
return (
<div className="fixed top-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full shadow-md z-50">
✨ {coins} Coins
</div>
);
};


export default CoinCounter;