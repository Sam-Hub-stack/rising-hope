"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowRight, AudioLines, Bot, Check, ChevronRight, Circle,
  Clock3, Crown, Database, Gauge, Heart, Landmark, LoaderCircle, Lock,
  Menu, MessageSquare, Mic, MicOff, Pencil, Plus, Send, Sparkles, Star,
  Trash2, Volume2, VolumeX, X,
} from "lucide-react";
import { HopeLogo } from "@/components/logo";
import { formatCompact, formatMoney, timeAgo } from "@/lib/format";

type Action = { label: string; href: string };
type Conversation = { id: string; title: string; updatedAt: string; createdAt: string };
type Message = { id: string; role: "user" | "assistant"; content: string; actions: Action[]; createdAt: string };
type Memory = { id: string; label: string; value: string; pinned: boolean; ownerKey: string };
type ContextData = {
  creator: string;
  mode: "neural" | "local";
  owner: { displayName: string; isCreator: boolean };
  stats: { totalRaised: number; totalGifts: number; beneficiaries: number; pendingApplications: number; avgRating: number };
  memories: { label: string; value: string; pinned: boolean }[];
  capabilities: string[];
};

const SUGGESTIONS = [
  "Who created you?",
  "Give me a full status report",
  "How do micro-donations work?",
  "Show me campaign progress",
  "Which partner banks are registered?",
  "How many members are waiting?",
];

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<ContextData | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [panel, setPanel] = useState<"chats" | "memories">("chats");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [memoryForm, setMemoryForm] = useState<{ id?: string; label: string; value: string; pinned: boolean } | null>(null);
  const [toast, setToast] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const notify = useCallback((text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceOn || muted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\n/g, " ").slice(0, 700));
    utterance.rate = 1.02;
    utterance.pitch = 0.92;
    window.speechSynthesis.speak(utterance);
  }, [voiceOn, muted]);

  const loadConversations = useCallback(async () => {
    const response = await fetch("/api/assistant/conversations");
    if (!response.ok) return;
    const data = await response.json();
    setConversations(data.conversations);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const response = await fetch(`/api/assistant/conversations/${id}`);
    if (!response.ok) return;
    const data = await response.json();
    setActiveId(id);
    setMessages(data.messages);
    setSidebarOpen(false);
  }, []);

  const loadMemories = useCallback(async () => {
    const response = await fetch("/api/assistant/memories");
    if (!response.ok) return;
    const data = await response.json();
    setMemories(data.memories);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [contextResponse] = await Promise.all([fetch("/api/assistant/context"), loadConversations(), loadMemories()]);
        if (contextResponse.ok) setContext(await contextResponse.json());
      } catch {
        notify("Could not reach the command center.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      recognitionRef.current?.stop?.();
    };
  }, [loadConversations, loadMemories, notify]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    let conversationId = activeId;
    if (!conversationId) {
      const createdResponse = await fetch("/api/assistant/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed.slice(0, 60) }),
      });
      if (!createdResponse.ok) return notify("Could not start a new session.");
      const created = await createdResponse.json();
      conversationId = created.conversation.id;
      setConversations((current) => [created.conversation, ...current]);
      setActiveId(conversationId);
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, role: "user", content: trimmed, actions: [], createdAt: new Date().toISOString() };
    setMessages((current) => [...current, optimistic]);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Request failed.");

      setMessages((current) => [
        ...current.filter((message) => message.id !== tempId),
        { id: `user-${Date.now()}`, role: "user", content: trimmed, actions: [], createdAt: new Date().toISOString() },
        data.message,
      ]);
      speak(data.message.content);
      await loadConversations();
    } catch (error) {
      setMessages((current) => current.filter((message) => message.id !== tempId));
      notify(error instanceof Error ? error.message : "Transmission failed.");
    } finally {
      setBusy(false);
    }
  }, [activeId, busy, loadConversations, notify, speak]);

  const newSession = async () => {
    const response = await fetch("/api/assistant/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New conversation" }),
    });
    if (!response.ok) return notify("Could not start a new session.");
    const data = await response.json();
    setConversations((current) => [data.conversation, ...current]);
    setActiveId(data.conversation.id);
    setMessages([]);
    setSidebarOpen(false);
  };

  const renameConversation = async (conversation: Conversation) => {
    const title = window.prompt("Rename session", conversation.title);
    if (!title || title === conversation.title) return;
    setConversations((current) => current.map((item) => item.id === conversation.id ? { ...item, title } : item));
    const response = await fetch(`/api/assistant/conversations/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) notify("Could not rename this session.");
  };

  const deleteConversation = async (conversation: Conversation) => {
    if (!window.confirm(`Delete "${conversation.title}"?`)) return;
    setConversations((current) => current.filter((item) => item.id !== conversation.id));
    const response = await fetch(`/api/assistant/conversations/${conversation.id}`, { method: "DELETE" });
    if (!response.ok) notify("Could not delete this session.");
    if (activeId === conversation.id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  const saveMemory = async () => {
    if (!memoryForm?.label || !memoryForm.value) return;
    const isEdit = Boolean(memoryForm.id);
    const response = await fetch(isEdit ? `/api/assistant/memories/${memoryForm.id}` : "/api/assistant/memories", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memoryForm),
    });
    if (!response.ok) return notify("Could not save this memory.");
    setMemoryForm(null);
    await loadMemories();
    notify(isEdit ? "Memory updated." : "Memory stored.");
  };

  const deleteMemory = async (memory: Memory) => {
    if (memory.ownerKey === "global") return notify("Core identity memories are locked.");
    if (!window.confirm("Forget this memory?")) return;
    setMemories((current) => current.filter((item) => item.id !== memory.id));
    const response = await fetch(`/api/assistant/memories/${memory.id}`, { method: "DELETE" });
    if (!response.ok) notify("Could not remove this memory.");
  };

  const toggleVoice = () => {
    if (voiceOn) {
      recognitionRef.current?.stop?.();
      window.speechSynthesis?.cancel();
      setVoiceOn(false);
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return notify("Voice input isn't supported in this browser.");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript ?? "");
      if (transcript) sendMessage(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setVoiceOn(true);
    recognition.start();
    setListening(true);
  };

  const micToggle = () => {
    if (!voiceOn) return toggleVoice();
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
    } else {
      recognitionRef.current?.start?.();
      setListening(true);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink p-6">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 animate-pulse place-items-center rounded-full border border-mint/30 bg-mint/10"><Bot className="h-9 w-9 text-mint" /></div>
          <p className="mt-5 font-mono-tech text-[11px] uppercase tracking-[0.3em] text-mint">Initializing systems</p>
          <p className="mt-2 text-xs text-muted">Calibrating voice, memory and mission telemetry...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid-bg flex h-screen min-h-[620px] overflow-hidden bg-ink text-ice">
      {/* Left rail */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col border-r border-white/8 bg-[#080f18] transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[72px] items-center justify-between border-b border-white/8 px-5">
          <HopeLogo />
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-muted lg:hidden"><X className="h-4 w-4" /></button>
        </div>
        <div className="border-b border-white/8 px-4 py-5">
          <div className="flex items-center gap-3 rounded-2xl border border-mint/20 bg-gradient-to-br from-mint/10 to-transparent p-4">
            <div className="relative grid h-11 w-11 place-items-center rounded-full border border-mint/40">
              <span className="absolute inset-0 animate-ring rounded-full border border-mint/40" />
              <Bot className="h-5 w-5 text-mint" />
            </div>
            <div>
              <p className="font-display text-sm font-bold">J.A.R.V.I.S.</p>
              <p className="font-mono-tech text-[9px] uppercase tracking-[0.2em] text-mint">Online · {context?.mode === "neural" ? "Neural link" : "Local core"}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-coral/20 bg-coral/[0.06] px-3 py-2">
            <Crown className="h-3.5 w-3.5 text-coral" />
            <p className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-muted">Created by <span className="text-coral">{context?.creator ?? "Sam"}</span></p>
          </div>
        </div>
        <div className="flex gap-1 border-b border-white/8 px-4 pt-3">
          <button onClick={() => setPanel("chats")} className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-[11px] font-semibold ${panel === "chats" ? "bg-mint/10 text-mint" : "text-muted hover:text-ice"}`}><MessageSquare className="h-3.5 w-3.5" /> Sessions</button>
          <button onClick={() => setPanel("memories")} className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-[11px] font-semibold ${panel === "memories" ? "bg-mint/10 text-mint" : "text-muted hover:text-ice"}`}><Database className="h-3.5 w-3.5" /> Memory</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {panel === "chats" ? (
            <>
              <button onClick={newSession} className="btn-primary mb-3 w-full py-2 text-xs"><Plus className="h-3.5 w-3.5" /> New session</button>
              {conversations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
                  <MessageSquare className="mx-auto h-6 w-6 text-muted/50" />
                  <p className="mt-3 text-xs text-muted">No sessions yet. Start one and I'll remember it.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <div key={conversation.id} className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 transition ${activeId === conversation.id ? "bg-mint/10 text-mint" : "text-muted hover:bg-white/5 hover:text-ice"}`}>
                      <button onClick={() => loadConversation(conversation.id)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-xs font-semibold">{conversation.title}</p>
                        <p className="font-mono-tech text-[9px] text-muted/70">{timeAgo(conversation.updatedAt)}</p>
                      </button>
                      <button onClick={() => renameConversation(conversation)} className="opacity-0 transition group-hover:opacity-100"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => deleteConversation(conversation)} className="opacity-0 transition group-hover:opacity-100 hover:text-coral"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <button onClick={() => setMemoryForm({ label: "", value: "", pinned: false })} className="btn-primary mb-3 w-full py-2 text-xs"><Plus className="h-3.5 w-3.5" /> Add memory</button>
              <div className="space-y-2">
                {memories.map((memory) => (
                  <div key={memory.id} className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-ice">{memory.pinned && <Star className="h-3 w-3 fill-coral text-coral" />}{memory.label}</p>
                      {memory.ownerKey === "global" ? <Lock className="h-3 w-3 text-muted/60" /> : (
                        <div className="flex gap-1">
                          <button onClick={() => setMemoryForm({ id: memory.id, label: memory.label, value: memory.value, pinned: memory.pinned })} className="text-muted hover:text-mint"><Pencil className="h-3 w-3" /></button>
                          <button onClick={() => deleteMemory(memory)} className="text-muted hover:text-coral"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-[10px] leading-relaxed text-muted">{memory.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="border-t border-white/8 p-4">
          <Link href="/" className="flex items-center gap-2 text-[11px] text-muted hover:text-mint"><ChevronRight className="h-3 w-3 rotate-180" /> Back to Rising Hope</Link>
        </div>
      </aside>

      {/* Main console */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-white/8 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-muted lg:hidden"><Menu className="h-4 w-4" /></button>
            <div>
              <p className="font-mono-tech text-[9px] uppercase tracking-[0.24em] text-mint">AI command center</p>
              <h1 className="font-display text-base font-bold sm:text-lg">Good to see you, {context?.owner.isCreator ? "Sam" : context?.owner.displayName ?? "operator"}.</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-mint/20 bg-mint/[0.06] px-3 py-1.5 font-mono-tech text-[9px] uppercase tracking-widest text-mint sm:flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" /> All systems nominal</span>
            <button onClick={toggleVoice} title="Toggle voice mode" className={`grid h-9 w-9 place-items-center rounded-xl border transition ${voiceOn ? "border-mint/50 bg-mint/10 text-mint" : "border-white/10 text-muted hover:text-ice"}`}>{voiceOn ? <AudioLines className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}</button>
            <button onClick={() => setMuted(!muted)} title={muted ? "Unmute responses" : "Mute responses"} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-muted hover:text-ice">{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
              {messages.length === 0 ? (
                <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center py-10 text-center">
                  <div className="relative mb-6 grid h-28 w-28 place-items-center rounded-full border border-mint/30 bg-mint/[0.04]">
                    <span className="absolute inset-0 animate-ring rounded-full border border-mint/40" />
                    <span className="absolute inset-4 rounded-full border border-dashed border-mint/20" />
                    <Bot className="h-11 w-11 text-mint" />
                  </div>
                  <p className="section-kicker">Awaiting instruction</p>
                  <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">How can I assist, {context?.owner.isCreator ? "Sam" : "operator"}?</h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">I have live access to the Rising Hope mission ledger, campaigns, partner banks, people and membership workflow. Try one of these.</p>
                  <div className="mt-7 grid w-full gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button key={suggestion} onClick={() => sendMessage(suggestion)} className="panel flex items-center justify-between px-4 py-3 text-left text-xs text-muted transition hover:border-mint/40 hover:text-ice">
                        {suggestion}<ArrowRight className="h-3.5 w-3.5 text-mint" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-6">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      {message.role === "assistant" && (
                        <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-mint/30 bg-mint/10"><Bot className="h-4 w-4 text-mint" /></div>
                      )}
                      <div className={`max-w-[82%] ${message.role === "user" ? "rounded-2xl rounded-br-sm border border-mint/25 bg-mint/10 px-4 py-3" : "panel px-4 py-4 sm:px-5"}`}>
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{message.content}</p>
                        {message.actions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.actions.map((item) => (
                              <Link key={item.href + item.label} href={item.href} className="inline-flex items-center gap-1.5 rounded-full border border-mint/25 bg-mint/[0.06] px-3 py-1.5 text-[11px] font-semibold text-mint hover:bg-mint/15">{item.label}<ArrowRight className="h-3 w-3" /></Link>
                            ))}
                          </div>
                        )}
                        <p className={`mt-2 font-mono-tech text-[9px] uppercase tracking-widest ${message.role === "user" ? "text-mint/60" : "text-muted/60"}`}>{message.role === "assistant" ? "J.A.R.V.I.S." : "You"} · {timeAgo(message.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  {busy && (
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-xl border border-mint/30 bg-mint/10"><Bot className="h-4 w-4 text-mint" /></div>
                      <div className="panel flex items-center gap-2 px-4 py-3 text-xs text-muted"><LoaderCircle className="h-4 w-4 animate-spin text-mint" /> Processing request...</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="shrink-0 border-t border-white/8 bg-[#080f18]/80 px-4 py-4 backdrop-blur-xl sm:px-8">
              <div className="mx-auto max-w-3xl">
                <div className="panel flex items-end gap-2 p-2">
                  <button onClick={micToggle} title="Voice input" className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${listening ? "bg-coral/15 text-coral" : voiceOn ? "bg-mint/10 text-mint" : "text-muted hover:text-ice"}`}>{listening ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}</button>
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(input); } }}
                    rows={1}
                    placeholder="Speak or type a command..."
                    className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-ice outline-none placeholder:text-muted/60"
                  />
                  <button onClick={() => sendMessage(input)} disabled={busy || !input.trim()} className="btn-primary h-10 w-10 shrink-0 rounded-xl p-0"><Send className="h-4 w-4" /></button>
                </div>
                <p className="mt-2 text-center font-mono-tech text-[9px] uppercase tracking-[0.18em] text-muted/60">Enter to send · Shift+Enter for a new line · Voice mode {voiceOn ? "active" : "standby"}</p>
              </div>
            </div>
          </div>

          {/* Telemetry panel */}
          <aside className="hidden w-[270px] shrink-0 flex-col border-l border-white/8 bg-[#080f18]/60 xl:flex">
            <div className="border-b border-white/8 px-5 py-5">
              <p className="section-kicker">Live telemetry</p>
              <div className="mt-4 space-y-3">
                {[
                  { icon: Heart, label: "Season raised", value: formatCompact(context?.stats.totalRaised ?? 0), tone: "text-mint" },
                  { icon: Activity, label: "Gifts recorded", value: String(context?.stats.totalGifts ?? 0), tone: "text-sky" },
                  { icon: Sparkles, label: "People in care", value: String(context?.stats.beneficiaries ?? 0), tone: "text-coral" },
                  { icon: Star, label: "Avg. rating", value: `${(context?.stats.avgRating ?? 0).toFixed(1)}★`, tone: "text-violet" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
                    <item.icon className={`h-4 w-4 ${item.tone}`} />
                    <div className="min-w-0 flex-1"><p className="truncate text-[10px] text-muted">{item.label}</p><p className="font-display text-sm font-bold">{item.value}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <p className="section-kicker">Capabilities</p>
              <div className="mt-4 space-y-2">
                {context?.capabilities.map((capability) => (
                  <div key={capability} className="flex items-center gap-2 text-[11px] text-muted"><Check className="h-3 w-3 text-mint" />{capability}</div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-mint/20 bg-mint/[0.05] p-4">
                <Crown className="h-4 w-4 text-coral" />
                <p className="mt-2 font-display text-xs font-bold">Creator protocol</p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">Designed and created by <span className="text-coral">Sam</span>. Core identity memories are locked to preserve the mission.</p>
              </div>
              <div className="mt-4 space-y-1">
                <Link href="/dashboard" className="flex items-center justify-between rounded-xl px-3 py-2 text-[11px] text-muted hover:bg-white/5 hover:text-ice">Dashboard <Gauge className="h-3 w-3" /></Link>
                <Link href="/#give" className="flex items-center justify-between rounded-xl px-3 py-2 text-[11px] text-muted hover:bg-white/5 hover:text-ice">Giving console <Heart className="h-3 w-3" /></Link>
                <Link href="/dashboard/banks" className="flex items-center justify-between rounded-xl px-3 py-2 text-[11px] text-muted hover:bg-white/5 hover:text-ice">Partner banks <Landmark className="h-3 w-3" /></Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Memory editor */}
      {memoryForm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setMemoryForm(null); }}>
          <div className="panel-strong w-full max-w-md p-6">
            <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">{memoryForm.id ? "Edit memory" : "Store memory"}</h2><button onClick={() => setMemoryForm(null)} className="text-muted hover:text-ice"><X className="h-4 w-4" /></button></div>
            <div className="mt-5 space-y-4">
              <div><label className="label">Label</label><input className="input" value={memoryForm.label} onChange={(event) => setMemoryForm({ ...memoryForm, label: event.target.value })} placeholder="e.g. Preferred greeting" /></div>
              <div><label className="label">What should I remember?</label><textarea rows={4} className="input resize-none" value={memoryForm.value} onChange={(event) => setMemoryForm({ ...memoryForm, value: event.target.value })} /></div>
              <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={memoryForm.pinned} onChange={(event) => setMemoryForm({ ...memoryForm, pinned: event.target.checked })} className="accent-[#6ef2c8]" /> Pin as core memory</label>
              <button onClick={saveMemory} className="btn-primary w-full">Save memory <Check className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-5 right-5 z-[90] rounded-xl border border-coral/30 bg-[#24140f]/95 px-4 py-3 text-xs text-coral shadow-2xl backdrop-blur-xl">{toast}</div>}
    </main>
  );
}
