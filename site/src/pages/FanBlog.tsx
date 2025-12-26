/**
 * FAN Tier - Blog Page
 * Features: In-universe articles, character pieces
 */

import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

const blogPosts = [
  {
    id: '1',
    title: 'Lala\'s Fashion Philosophy',
    excerpt: 'Discover the principles that guide my styling choices and how you can apply them to your wardrobe.',
    author: 'Lala',
    date: new Date('2025-12-20'),
    emoji: '✨',
    category: 'Fashion',
    readTime: 5,
  },
  {
    id: '2',
    title: 'The Story Behind My Signature Look',
    excerpt: 'How I developed my iconic style and what it means to me. A deep dive into personal fashion identity.',
    author: 'Lala',
    date: new Date('2025-12-18'),
    emoji: '👗',
    category: 'Personal',
    readTime: 7,
  },
  {
    id: '3',
    title: 'Color Theory Basics for Styling',
    excerpt: 'Understanding color combinations can transform your styling game. Learn the fundamentals here.',
    author: 'Styling Team',
    date: new Date('2025-12-15'),
    emoji: '🎨',
    category: 'Tutorial',
    readTime: 6,
  },
  {
    id: '4',
    title: 'Budget Fashion Hacks',
    excerpt: 'You don\'t need expensive clothes to look fabulous. Here are my best budget styling tips.',
    author: 'Lala',
    date: new Date('2025-12-12'),
    emoji: '💰',
    category: 'Lifestyle',
    readTime: 4,
  },
];

export function FanBlog() {
  const [currentPage, setCurrentPage] = useState('blog');
  const [user] = useState({
    id: 'user_123',
    name: 'Sarah',
    tier: 'fan' as const,
  });
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  const selected = blogPosts.find((post) => post.id === selectedPost);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">✨ LALA Blog</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Fashion insights, styling tips, and behind-the-scenes stories
        </p>
      </div>

      {/* Featured Post */}
      {selected ? (
        <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-8">
          <button
            onClick={() => setSelectedPost(null)}
            className="text-purple-600 hover:text-purple-700 mb-4 font-semibold"
          >
            ← Back to Blog
          </button>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">{selected.emoji}</span>
            <div>
              <h2 className="text-4xl font-bold">{selected.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                By {selected.author} • {selected.date.toLocaleDateString()} • {selected.readTime} min read
              </p>
            </div>
          </div>

          <Badge variant="info" className="mb-6">
            {selected.category}
          </Badge>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              {selected.excerpt}
            </p>

            <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-6 mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Full article content would be displayed here. This is where the complete blog post would appear,
                with formatting, images, and interactive elements. Continue reading for styling insights and tips
                that will elevate your fashion game!
              </p>
            </div>

            <div className="flex gap-4">
              <Button variant="primary">Share Article</Button>
              <Button variant="ghost">Save for Later</Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Blog Posts Grid */}
          <div className="space-y-4 mb-8">
            {blogPosts.map((post) => (
              <Card
                key={post.id}
                hoverable
                onClick={() => setSelectedPost(post.id)}
                className="p-6 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{post.emoji}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant="default">{post.category}</Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {post.readTime}min read
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {post.date.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Subscribe CTA */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-3">Stay Updated 📬</h2>
            <p className="text-lg opacity-90 mb-6">
              Get the latest fashion insights and blog posts delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 rounded-lg text-black"
              />
              <Button variant="secondary">Subscribe</Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default FanBlog;
