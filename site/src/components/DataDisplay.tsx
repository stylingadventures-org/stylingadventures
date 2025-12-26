/**
 * Reusable UI Components - Data Display
 */

import React from 'react';
import { Badge } from './Badge';
import { Card } from './Card';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  challenges: number;
  avatar: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <div className="space-y-2">
      {entries.slice(0, 20).map((entry) => (
        <div key={entry.rank} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-bold">
            {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
          </div>
          <img src={entry.avatar} alt={entry.name} className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <p className="font-semibold">{entry.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{entry.challenges} challenges</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-purple-600">{entry.score.toLocaleString()}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">pts</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface AchievementData {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked?: boolean;
}

interface AchievementGridProps {
  achievements: AchievementData[];
}

export function AchievementGrid({ achievements }: AchievementGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {achievements.map((achievement) => (
        <Card
          key={achievement.id}
          className={`p-4 text-center ${achievement.unlocked ? 'opacity-100' : 'opacity-60'}`}
        >
          <div className="text-4xl mb-2">{achievement.icon}</div>
          <h4 className="font-semibold text-sm">{achievement.name}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{achievement.description}</p>
          {achievement.unlocked && <Badge variant="success" className="mt-2 text-xs">Unlocked</Badge>}
        </Card>
      ))}
    </div>
  );
}

interface TableColumn {
  key: string;
  label: string;
  render?: (value: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: Record<string, any>[];
}

export function Table({ columns, data }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 dark:bg-slate-700">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-2 text-left font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-2">
                  {column.render ? column.render(row[column.key]) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ContentCardProps {
  title: string;
  description?: string;
  image: string;
  emoji: string;
  views?: number;
  likes?: number;
  onClick?: () => void;
}

export function ContentCard({
  title,
  description,
  emoji,
  views,
  likes,
  onClick,
}: ContentCardProps) {
  return (
    <Card hoverable onClick={onClick} className="overflow-hidden">
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 aspect-video flex items-center justify-center text-6xl">
        {emoji}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        {description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>}
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          {views !== undefined && <span>👁️ {views.toLocaleString()}</span>}
          {likes !== undefined && <span>❤️ {likes.toLocaleString()}</span>}
        </div>
      </div>
    </Card>
  );
}
