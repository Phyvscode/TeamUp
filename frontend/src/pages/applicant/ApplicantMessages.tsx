import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Send, Search, UserPlus, Loader2, MessageSquare, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Message {
  _id: string;
  sender: 'me' | 'recruiter';
  senderName: string;
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  recruiterId: string;
  recruiterName: string;
  company: string;
  lastMessage: string;
  unread: number;
  messages: Message[];
}

interface Recruiter {
  _id: string;
  name: string;
  email: string;
  company?: string;
  avatar?: string;
}

const token = () => localStorage.getItem('auth_token');

const ApplicantMessages = () => {
  const [conversations, setConversations]     = useState<Conversation[]>([]);
  const [activeId, setActiveId]               = useState<string>('');
  const [newMessage, setNewMessage]           = useState('');
  const [loading, setLoading]                 = useState(true);
  const [sending, setSending]                 = useState(false);

  // New conversation picker
  const [showPicker, setShowPicker]           = useState(false);
  const [recruiters, setRecruiters]           = useState<Recruiter[]>([]);
  const [recruiterSearch, setRecruiterSearch] = useState('');
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeId]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/api/messages', {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setConversations(data);
      if (data.length > 0 && !activeId) setActiveId(data[0].id);
    } catch {
      toast.error('Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecruiters = async () => {
    setLoadingRecruiters(true);
    try {
      const res  = await fetch('http://localhost:5000/api/users/recruiters', {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setRecruiters(data);
    } catch {
      toast.error('Failed to load recruiters.');
    } finally {
      setLoadingRecruiters(false);
    }
  };

  const openPicker = () => {
    setShowPicker(true);
    fetchRecruiters();
  };

  const handleStartConversation = async (recruiter: Recruiter) => {
    try {
      const res = await fetch('http://localhost:5000/api/users/start-conversation', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ targetUserId: recruiter._id }),
      });
      const conv = await res.json();

      const existing = conversations.find((c) => c.id === conv.id);
      if (!existing) setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      setShowPicker(false);
      setRecruiterSearch('');
    } catch {
      toast.error('Could not start conversation.');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const active = conversations.find((c) => c.id === activeId);
    if (!newMessage.trim() || !active) return;

    setSending(true);
    try {
      const res = await fetch('http://localhost:5000/api/messages', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          receiverId: active.recruiterId,
          text:       newMessage.trim(),
        }),
      });

      if (!res.ok) throw new Error('Send failed');
      const savedMsg = await res.json();

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, savedMsg], lastMessage: savedMsg.text }
            : c
        )
      );
      setNewMessage('');
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setActiveId(id);
    const conv = conversations.find((c) => c.id === id);
    if (!conv || conv.unread === 0) return;

    try {
      await fetch(`http://localhost:5000/api/messages/${id}/read`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token()}` },
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
      );
    } catch {
      // Non-critical
    }
  };

  const active = conversations.find((c) => c.id === activeId);
  const filteredRecruiters = recruiters.filter((r) =>
    r.name.toLowerCase().includes(recruiterSearch.toLowerCase()) ||
    (r.company || '').toLowerCase().includes(recruiterSearch.toLowerCase())
  );

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold font-display text-foreground">Messages</h1>
          <Button onClick={openPicker} size="sm">
            <UserPlus className="w-4 h-4 mr-2" /> Message a Recruiter
          </Button>
        </div>

        {/* Recruiter picker modal */}
        {showPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-display text-foreground">
                  Message a Recruiter
                </h2>
                <button
                  onClick={() => { setShowPicker(false); setRecruiterSearch(''); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or company…"
                  value={recruiterSearch}
                  onChange={(e) => setRecruiterSearch(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {loadingRecruiters ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredRecruiters.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No recruiters found.
                  </p>
                ) : (
                  filteredRecruiters.map((recruiter) => (
                    <button
                      key={recruiter._id}
                      onClick={() => handleStartConversation(recruiter)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {recruiter.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm">{recruiter.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {recruiter.company || recruiter.email}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Chat UI */}
        <div
          className="flex rounded-xl border border-border bg-card shadow-card overflow-hidden"
          style={{ height: '72vh' }}
        >
          {/* Sidebar */}
          <div className="w-72 border-r border-border flex flex-col shrink-0">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Conversations
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No conversations yet.</p>
                  <button onClick={openPicker} className="text-primary text-xs mt-2 hover:underline">
                    Message a recruiter
                  </button>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left p-4 border-b border-border transition-colors ${
                      activeId === conv.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {conv.recruiterName?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground text-sm truncate">
                            {conv.recruiterName}
                          </p>
                          {conv.unread > 0 && (
                            <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center shrink-0">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.company || conv.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {active ? (
              <>
                <div className="p-4 border-b border-border shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {active.recruiterName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{active.recruiterName}</p>
                      <p className="text-xs text-muted-foreground">
                        {active.company || 'Recruiter'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {active.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-10 h-10 text-muted-foreground mb-2 opacity-40" />
                      <p className="text-sm text-muted-foreground">
                        Send a message to start the conversation.
                      </p>
                    </div>
                  ) : (
                    active.messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.sender === 'me'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}
                        >
                          <p className="leading-relaxed">{msg.text}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              msg.sender === 'me'
                                ? 'text-primary-foreground/60'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="p-4 border-t border-border flex gap-2 shrink-0"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${active.recruiterName}…`}
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">
                  Select a conversation or message a recruiter.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ApplicantMessages;