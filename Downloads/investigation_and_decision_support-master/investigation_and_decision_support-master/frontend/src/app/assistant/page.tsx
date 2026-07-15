'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  Download, 
  Clock, 
  PlusCircle, 
  BookOpen, 
  TrendingUp, 
  MapPin, 
  AlertTriangle,
  Cpu
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  // Custom response widgets
  tableData?: any[];
  chartData?: any[];
  recommendations?: string[];
  caseLinks?: { firNumber: string; path: string }[];
}

export default function AICopilot() {
  const { token, isDemoMode } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Greetings. I am KSP Crime Intelligence Copilot. I can query state-wide records, detect recidivism patterns, estimate predictive hot zones, and draft case intelligence reports. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    { label: 'Robbery cases Bengaluru', icon: MapPin },
    { label: 'Detect repeat offenders', icon: AlertTriangle },
    { label: ' Burglary hotspot prediction', icon: TrendingUp },
    { label: 'Summarize FIR-2026-0045', icon: BookOpen }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent, presetText?: string) => {
    if (e) e.preventDefault();
    const query = presetText || input;
    if (!query.trim()) return;

    // Append User Message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI Copilot analysis response with widgets
    setTimeout(async () => {
      let responseText = '';
      let tableData: any[] | undefined = undefined;
      let chartData: any[] | undefined = undefined;
      let recommendations: string[] | undefined = undefined;
      let caseLinks: any[] | undefined = undefined;

      const q = query.toLowerCase();

      // Check presets to yield high fidelity mock widgets
      if (q.includes('robbery') || q.includes('bengaluru')) {
        responseText = 'Here is the search query feedback. Found robbery cases registered under Bengaluru City Police Station indices. I noticed a localized cluster near Koramangala 4th Block, active primarily during late hours.';
        tableData = [
          { fir: 'FIR-2026-0045', station: 'Koramangala PS', date: '15-Jun-2026', suspect: 'Ramesh Kumar' },
          { fir: 'FIR-2026-0038', station: 'HSR Layout PS', date: '04-Jun-2026', suspect: 'Unknown' }
        ];
        caseLinks = [{ firNumber: 'FIR-2026-0045', path: '/search?q=FIR-2026-0045' }];
        recommendations = [
          'Deploy active petrol units near Sony World Signal between 22:00 and 03:00.',
          'Cross-reference getaway motorcycle records with regional ANPR cameras.'
        ];
      } else if (q.includes('repeat') || q.includes('offenders')) {
        responseText = 'Analysing criminal association histories. Identified prominent repeat offenders based on high risk indices and similar crime categories.';
        tableData = [
          { name: "Ramesh 'Kulla' Kumar", risk: '85%', status: 'ACTIVE', offences: '12 cases' },
          { name: "Shaji 'Doctor' Mathew", risk: '92%', status: 'ABSCONDING', offences: '18 cases' }
        ];
        recommendations = [
          'Flag active SIM communication details for Syed Karim (accomplice in custody).',
          'Deploy warrant execution teams at Shaji Mathew known associate hubs.'
        ];
      } else if (q.includes('burglary') || q.includes('hotspot') || q.includes('prediction')) {
        responseText = 'Estimating burglary hot zones using DBSCAN density projections. The model detects burglary concentrations in Indiranagar 12th Main Road, showing a 25% MoM increase.';
        chartData = [
          { week: 'Week 1', count: 2 },
          { week: 'Week 2', count: 3 },
          { week: 'Week 3', count: 8 },
          { week: 'Week 4', count: 12 }
        ];
        recommendations = [
          'Verify fingerprint match cards at Indiranagar villas with current parole registers.',
          'Advise nightbeat marshals to verify lock-and-key status of unoccupied blocks.'
        ];
      } else if (q.includes('summarize') || q.includes('0045')) {
        responseText = 'FIR-2026-0045 Case Briefing:\n\n• Offence: Armed robbery under Koramangala PS.\n• Complainant: Anoop Kumar S.\n• Stolen properties: Gold chain (24g), laptop.\n• Getaway vehicle: Black scooter plate KA-01-HE-7890 (registered to suspect Ramesh Kumar).\n• Active evidence: Machete recovered from scene.\n\nSuggested action details follow:';
        recommendations = [
          'Execute arrest order for Ramesh Kumar (Wanted, active gang lead).',
          'Complete chargesheet draft before legal filing deadlines.'
        ];
        caseLinks = [{ firNumber: 'FIR-2026-0045', path: '/search?q=FIR-2026-0045' }];
      } else {
        responseText = 'I have analyzed KSP indices for your query. No specific high-density anomalies identified. Let me know if you would like me to summarize any active case file or run district similarity correlations.';
      }

      // If connected to live FastAPI server in production
      if (!isDemoMode) {
        try {
          const res = await fetch('http://localhost:5000/api/ai/chat', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ message: query })
          });
          if (res.ok) {
            const data = await res.json();
            responseText = data.response;
            if (data.table) tableData = data.table;
            if (data.chart) chartData = data.chart;
            if (data.recommendations) recommendations = data.recommendations;
          }
        } catch (err) {
          console.warn('AI Python service offline, presenting mock copilot analytics');
        }
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        tableData,
        chartData,
        recommendations,
        caseLinks
      };

      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="h-[80vh] flex flex-col md:flex-row gap-6">
      {/* Active Conversation Pane */}
      <div className="flex-1 glass-card rounded-xl flex flex-col justify-between overflow-hidden relative">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-purple-900/5 blur-[80px] pointer-events-none" />

        {/* Chat Header */}
        <div className="p-4 border-b border-slate-900 bg-slate-950/20 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight">KSP Investigation Copilot</h3>
              <p className="text-[10px] text-slate-500 font-mono font-semibold uppercase">EXPLAINABLE AI GATEWAY</p>
            </div>
          </div>
          <button 
            onClick={() => toast.success('Dossier brief generated.')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-850 hover:border-slate-800 text-[10px] font-mono font-bold text-slate-400 hover:text-white uppercase rounded-md transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Log</span>
          </button>
        </div>

        {/* Messages list viewport */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin">
          {messages.map(m => (
            <div
              key={m.id}
              className={`flex gap-3.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-purple-950/40 border border-purple-900/40 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
              )}

              <div className="space-y-3.5 max-w-[80%]">
                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-[#111118]/80 border border-slate-850 text-slate-300 rounded-tl-none font-sans'
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>

                {/* Optional Widgets rendered in AI output stream */}
                {m.sender === 'ai' && (
                  <div className="space-y-3">
                    {/* 1. Data Tables */}
                    {m.tableData && (
                      <div className="bg-slate-950/40 border border-slate-900 rounded-xl overflow-hidden text-[11px] p-1 shadow-lg">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 font-mono text-[9px] uppercase">
                              <th className="p-2">Name / Case</th>
                              <th className="p-2">Details</th>
                              <th className="p-2">Active Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.tableData.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-900/40 last:border-0 text-slate-350">
                                <td className="p-2 font-medium text-white">{row.name || row.fir}</td>
                                <td className="p-2">{row.risk || row.station || row.date}</td>
                                <td className="p-2 font-mono text-purple-400 font-semibold">{row.status || row.suspect}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 2. Charts */}
                    {m.chartData && (
                      <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 shadow-lg h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={m.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                            <XAxis dataKey="week" stroke="#475569" fontSize={9} tickLine={false} />
                            <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0B0B0F', borderColor: 'rgba(255,255,255,0.05)', fontSize: '10px' }} />
                            <Bar dataKey="count" fill="#7C3AED" radius={4} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* 3. Case Links */}
                    {m.caseLinks && (
                      <div className="flex gap-2">
                        {m.caseLinks.map(l => (
                          <span 
                            key={l.firNumber}
                            onClick={() => toast.info(`Routing to ${l.firNumber}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 rounded-lg text-[10px] font-mono font-bold text-purple-400 cursor-pointer transition"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Inspect {l.firNumber}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 4. Action Recommendations */}
                    {m.recommendations && (
                      <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2 shadow-lg">
                        <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>System suggestions (leads)</span>
                        </span>
                        <ul className="space-y-1.5 text-slate-350 text-[11px] list-disc list-inside">
                          {m.recommendations.map((rec, idx) => (
                            <li key={idx} className="leading-relaxed">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center shrink-0 text-slate-300 font-bold text-xs">
                  U
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-full bg-purple-950/40 border border-purple-900/40 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-purple-400 animate-pulse" />
              </div>
              <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono animate-pulse">Copilot is synthesizing logs...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-0" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-300" />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-900 bg-slate-950/20 flex gap-3 z-10">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Query cases, identify repeaters, ask for hot zone timelines..."
            className="flex-1 bg-[#111118]/80 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
          />
          <button
            type="submit"
            className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center justify-center shadow-lg shadow-purple-950/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Suggested Templates side card */}
      <div className="w-full md:w-72 flex flex-col gap-4">
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
              Suggested Queries
            </h4>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Click any prompt preset to instantly instruct the Copilot to analyze specific KSP folders:
          </p>
          <div className="space-y-2">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={e => handleSend(e, p.label)}
                className="w-full text-left p-3.5 bg-slate-950/30 border border-slate-900 hover:border-slate-850 rounded-xl text-slate-350 text-xs hover:text-white transition flex items-center gap-2.5 font-medium group"
              >
                <p.icon className="w-4.5 h-4.5 text-slate-550 group-hover:text-purple-400 transition" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
