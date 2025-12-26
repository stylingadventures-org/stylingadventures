/**
 * FAN Tier - Styling Adventures Page
 * Features: Challenge library, lite styling challenges only
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ChartContainer, SimpleBarChart } from '../components/Charts';
import { getMockChallenges } from '../utils/mockData';

export function FanStyling() {
  const [currentPage, setCurrentPage] = useState('styling');
  const [user] = useState({
    id: 'user_123',
    name: 'Sarah',
    tier: 'fan' as const,
  });
  const [completedChallenges, setCompletedChallenges] = useState<string[]>(['challenge_1']);

  const allChallenges = getMockChallenges();
  const fanChallenges = allChallenges.filter((c) => c.difficulty === 'easy' || c.difficulty === 'medium');

  const challengeStats = [
    { name: 'Easy', value: allChallenges.filter((c) => c.difficulty === 'easy').length },
    { name: 'Medium', value: allChallenges.filter((c) => c.difficulty === 'medium').length },
    { name: 'Hard', value: allChallenges.filter((c) => c.difficulty === 'hard').length },
  ];

  const handleCompleteChallenge = (id: string) => {
    if (!completedChallenges.includes(id)) {
      setCompletedChallenges([...completedChallenges, id]);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Styling Adventures 👗</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Challenge yourself with fun styling quests. Easy and medium challenges only for Fans!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Challenges Completed"
          value={completedChallenges.length}
          icon="✨"
          color="purple"
        />
        <StatCard
          label="Total Points Earned"
          value={(completedChallenges.length * 150).toLocaleString()}
          icon="🎯"
          color="pink"
        />
        <StatCard
          label="Win Streak"
          value="7 days"
          icon="🔥"
          trend={{ value: 3, isPositive: true }}
          color="emerald"
        />
      </div>

      {/* Difficulty Distribution */}
      <div className="mb-8">
        <ChartContainer title="Challenge Difficulty Distribution">
          <SimpleBarChart data={challengeStats} />
        </ChartContainer>
      </div>

      {/* Available Challenges */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Available Challenges ({fanChallenges.length})</h2>
        <div className="space-y-4">
          {fanChallenges.map((challenge) => {
            const isCompleted = completedChallenges.includes(challenge.id);
            return (
              <Card key={challenge.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">{challenge.emoji}</span>
                      <div>
                        <h3 className="text-xl font-bold">{challenge.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{challenge.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4 mt-3">
                      <Badge variant={challenge.difficulty === 'easy' ? 'success' : 'info'}>
                        {challenge.difficulty.toUpperCase()}
                      </Badge>
                      {challenge.requiredColors.map((color) => (
                        <Badge key={color} variant="default">{color}</Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Reward</p>
                        <p className="font-bold text-purple-600">+{challenge.reward} pts</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Time Limit</p>
                        <p className="font-bold">{(challenge.timeLimit || 0) / 60}min</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Status</p>
                        <p className="font-bold">{isCompleted ? '✅ Done' : '⏳ Available'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <Badge variant="success">Completed ✓</Badge>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => handleCompleteChallenge(challenge.id)}
                      >
                        Start Challenge
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Premium Challenges Teaser */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Want Harder Challenges? 🏆</h2>
            <p className="text-lg opacity-90">
              Unlock expert-level challenges and compete in global tournaments with Bestie+ tier!
            </p>
          </div>
          <Button variant="secondary" size="lg">
            Upgrade →
          </Button>
        </div>
      </div>
    </>
  );
}

export default FanStyling;
