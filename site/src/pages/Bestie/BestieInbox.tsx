/**
 * BESTIE Tier - Inbox (Messaging) Page
 * Features: Direct messages from followers, creator DMs, styled conversations
 */

import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { MainLayout } from '../../components/Layout';

export function BestieInbox() {
  const [currentPage, setCurrentPage] = useState('inbox');
  const [currentUser] = useState({
    id: 'bestie_123',
    name: 'Sarah',
    tier: 'bestie' as const,
  });

  const [selectedConversation, setSelectedConversation] = useState('conv_1');

  // Conversations list
  const conversations = [
    {
      id: 'conv_1',
      name: 'Luna Style Guide',
      avatar: '👑',
      lastMessage: 'Love your color combinations! Would love to collab ✨',
      timestamp: '2 min ago',
      unread: true,
      status: 'Creator',
      messageCount: 8,
    },
    {
      id: 'conv_2',
      name: 'Style Sisters Group',
      avatar: '👯',
      lastMessage: 'Sarah: That outfit is fire! 🔥',
      timestamp: '15 min ago',
      unread: false,
      status: 'Group',
      messageCount: 24,
    },
    {
      id: 'conv_3',
      name: 'Emma S.',
      avatar: '👩‍🦰',
      lastMessage: 'Where do you get all your inspo?',
      timestamp: '1 hour ago',
      unread: false,
      status: 'Friend',
      messageCount: 12,
    },
    {
      id: 'conv_4',
      name: 'Marcus Fashion',
      avatar: '👨‍🦱',
      lastMessage: 'Check out my new styling guide!',
      timestamp: '3 hours ago',
      unread: false,
      status: 'Creator',
      messageCount: 5,
    },
  ];

  // Messages in selected conversation
  const messageThread = [
    {
      id: 'msg_1',
      from: 'Luna',
      avatar: '👑',
      text: 'Hi Sarah! Your recent outfit post caught my eye 👀',
      timestamp: '2:30 PM',
      isOwn: false,
    },
    {
      id: 'msg_2',
      from: 'You',
      avatar: '👩',
      text: 'OMG Luna! Thank you so much 😭❤️',
      timestamp: '2:35 PM',
      isOwn: true,
    },
    {
      id: 'msg_3',
      from: 'Luna',
      avatar: '👑',
      text: 'The color coordination is insane. Have you studied color theory?',
      timestamp: '2:36 PM',
      isOwn: false,
    },
    {
      id: 'msg_4',
      from: 'You',
      avatar: '👩',
      text: 'I took some courses on the platform! Your tutorials helped so much 🙏',
      timestamp: '2:40 PM',
      isOwn: true,
    },
    {
      id: 'msg_5',
      from: 'Luna',
      avatar: '👑',
      text: 'Love your color combinations! Would love to collab ✨',
      timestamp: 'Just now',
      isOwn: false,
    },
  ];

  // Suggested creators to follow
  const suggestedCreators = [
    { id: 'creator_1', name: 'Zara Creates', avatar: '🌿', bio: 'Sustainable Fashion' },
    { id: 'creator_2', name: 'Alex M.', avatar: '✨', bio: 'Street Style' },
  ];

  return (
    <MainLayout
      tier={currentUser.tier}
      username={currentUser.name}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-8 border border-cyan-500/30">
          <h1 className="text-4xl font-bold text-white mb-2">💬 Your Inbox</h1>
          <p className="text-gray-300 text-lg">
            Chat with creators, followers, and friends. Build your styling community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-bold text-white">Messages</h2>
              </div>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full text-left p-4 transition-all border-l-4 ${
                      selectedConversation === conv.id
                        ? 'bg-cyan-500/20 border-l-cyan-500'
                        : 'bg-transparent border-l-transparent hover:bg-gray-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{conv.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{conv.name}</p>
                        <p className="text-gray-400 text-xs">{conv.timestamp}</p>
                      </div>
                      {conv.unread && <span className="w-3 h-3 bg-cyan-500 rounded-full" />}
                    </div>
                    <p className="text-gray-300 text-xs line-clamp-2">{conv.lastMessage}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 flex flex-col h-screen max-h-96 lg:max-h-none">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👑</span>
                  <div>
                    <p className="text-white font-bold">Luna Style Guide</p>
                    <p className="text-gray-400 text-xs">Online</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  ℹ️
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messageThread.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!msg.isOwn && <span className="text-2xl">{msg.avatar}</span>}
                    <div className={`max-w-xs ${msg.isOwn ? 'order-last' : ''}`}>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          msg.isOwn
                            ? 'bg-cyan-600 text-white rounded-br-none'
                            : 'bg-gray-700 text-gray-100 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      <p className="text-gray-400 text-xs mt-1 px-2">{msg.timestamp}</p>
                    </div>
                    {msg.isOwn && <span className="text-2xl">👩</span>}
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-700/50 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                  <Button variant="primary" size="sm">
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Suggested Creators to Chat With */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">💫 Start New Conversations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedCreators.map((creator) => (
              <Card key={creator.id} className="bg-gray-800/50 border-gray-700">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{creator.avatar}</span>
                    <div>
                      <p className="text-white font-bold">{creator.name}</p>
                      <p className="text-gray-400 text-sm">{creator.bio}</p>
                    </div>
                  </div>
                  <Button variant="primary" size="sm">
                    Message
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default BestieInbox;
