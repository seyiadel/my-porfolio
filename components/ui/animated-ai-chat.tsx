"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    FileUp,
    Figma,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Command,
    BookOpen,
    Activity,
    Globe,
    Code2,
    Linkedin,
    Github,
    Twitter,
    Mail,
    ExternalLink,
    Sun,
    Moon,
    Terminal as TerminalIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react"

interface Message {
    id: string;
    role: "user" | "assistant";
    content: React.ReactNode;
    timestamp: Date;
}

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }: TextareaProps, ref: React.Ref<HTMLTextAreaElement>) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <div className={cn(
        "relative",
        containerClassName
      )}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showRing && isFocused && (
          <motion.span 
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div 
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-violet-500 rounded-full"
            style={{
              animation: 'none',
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
            document.body.setAttribute('data-theme', savedTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [recentCommand, setRecentCommand] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const commandSuggestions: CommandSuggestion[] = [
        { 
            icon: <CircleUserRound className="w-4 h-4" />, 
            label: "About", 
            description: "Who I am & my summary", 
            prefix: "/about" 
        },
        { 
            icon: <Code2 className="w-4 h-4" />, 
            label: "Stack", 
            description: "Languages & tools", 
            prefix: "/stack" 
        },
        { 
            icon: <MonitorIcon className="w-4 h-4" />, 
            label: "Projects", 
            description: "Proof of work", 
            prefix: "/projects" 
        },
        { 
            icon: <BookOpen className="w-4 h-4" />, 
            label: "Articles", 
            description: "Technical writings", 
            prefix: "/articles" 
        },
        { 
            icon: <Globe className="w-4 h-4" />, 
            label: "Socials", 
            description: "Connect with me", 
            prefix: "/socials" 
        },
        { 
            icon: <Activity className="w-4 h-4" />, 
            label: "Vitals", 
            description: "Developer specs & status", 
            prefix: "/vitals" 
        },
    ];

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);
            
            if (value.length > 1) {
                const matchingSuggestionIndex = commandSuggestions.findIndex(
                    (cmd) => cmd.prefix.startsWith(value)
                );
                
                if (matchingSuggestionIndex >= 0) {
                    setActiveSuggestion(matchingSuggestionIndex);
                } else {
                    setActiveSuggestion(-1);
                }
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            
            if (commandPaletteRef.current && 
                !commandPaletteRef.current.contains(target) && 
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion((prev: number) => 
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion((prev: number) => 
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    handleSendMessage(selectedCommand.prefix);
                    setShowCommandPalette(false);
                } else {
                    handleSendMessage();
                    setShowCommandPalette(false);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    const handleSendMessage = (textOverride?: string) => {
        const messageText = textOverride || value;
        if (messageText.trim()) {
            const userMsg: Message = {
                id: Math.random().toString(36).substr(2, 9),
                role: 'user',
                content: messageText,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, userMsg]);
            const currentInput = messageText.trim().toLowerCase();
            setValue("");
            adjustHeight(true);

            startTransition(() => {
                setIsTyping(true);
                setTimeout(() => {
                    let response: React.ReactNode = (
                        <div className="space-y-1 font-mono">
                            <p className="text-sm text-foreground/60 mb-2">// Unknown command. Available tools:</p>
                            {commandSuggestions.map(cmd => (
                                <div key={cmd.prefix} className="flex items-center gap-3 py-0.5">
                                    <span className="text-violet-400 font-bold shrink-0 w-16">{cmd.prefix}</span>
                                    <span className="text-foreground/40 text-xs">--</span>
                                    <span className="text-foreground/80 text-xs italic">{cmd.description}</span>
                                </div>
                            ))}
                        </div>
                    );
                    
                    if (currentInput === '/' || currentInput === '/help') {
                        response = (
                            <div className="space-y-4 font-mono">
                                <p className="text-sm leading-relaxed text-foreground/90">
                                    Welcome to Seyi's portfolio.
                                </p>
                                <div>
                                    <p className="text-sm leading-relaxed text-foreground/90 mb-3">
                                        Try a command to explore:
                                    </p>
                                    <div className="grid gap-2 pl-2">
                                        {commandSuggestions.map((cmd) => (
                                            <div key={cmd.prefix} className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-violet-500 shrink-0 min-w-[70px]">
                                                    {cmd.prefix}
                                                </span>
                                                <span className="text-xs text-foreground/60">
                                                    - {cmd.description}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    } else if (currentInput.startsWith('/about')) {
                        response = (
                            <div className="space-y-4 font-mono">
                                <p className="text-sm leading-relaxed text-foreground/90">
                                    My work sits at the intersection of backend engineering, fintech, and blockchain. I’ve built stablecoin payment APIs, logistics tracking systems, decentralized savings protocols on Solana, and automation tools that integrate with messaging platforms.
                                </p>
                                <p className="text-sm leading-relaxed text-foreground/90">
                                    I approach engineering with a product mindset — thinking beyond writing code to how systems are designed, how users interact with them, and how technology can solve practical problems.
                                </p>
                                <p className="text-sm leading-relaxed text-foreground/90">
                                    My journey into software started from curiosity — the simple idea that you could tell a computer what to do and it would obey. A failed startup idea early on also taught me that building great products requires more than code. Since then, I’ve stayed interested in both engineering and product thinking.
                                </p>
                                <p className="text-sm leading-relaxed text-foreground/90">
                                    When I'm not building, I'm usually experimenting with new ideas, prototyping systems, or exploring new technologies.
                                </p>
                            </div>
                        );
                    } else if (currentInput.startsWith('/stack')) {
                        response = (
                            <div className="space-y-4 font-mono">
                                <div>
                                    <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-2">/usr/bin/languages</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 pl-1">
                                        {['TypeScript', 'JavaScript', 'Node.js', 'Python', 'PHP', 'Golang'].map(t => <span key={t} className="text-sm text-foreground/80">{t}</span>)}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-2">/usr/bin/backend-db</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 pl-1">
                                        {['Node.js', 'Express', 'FastAPI', 'Django', 'PostgreSQL', 'Redis', 'MongoDB'].map(t => <span key={t} className="text-sm text-foreground/80">{t}</span>)}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-2">/usr/bin/infra-blockchain</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 pl-1">
                                        {['Docker', 'AWS', 'Railway', 'Solana', 'Anchor'].map(t => <span key={t} className="text-sm text-foreground/80">{t}</span>)}
                                    </div>
                                </div>
                            </div>
                        );
                    } else if (currentInput.startsWith('/projects')) {
                        response = (
                            <div className="space-y-4 font-mono">
                                <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">/dev/features/projects</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="pl-1 border-l-2 border-violet-500/30 group">
                                        <a href="https://atlantispay.up.railway.app" target="_blank" className="block cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold transition-all text-foreground group-hover:text-violet-500">Atlantis Pay</p>
                                                <ExternalLink className="w-3 h-3 transition-colors text-foreground/20 group-hover:text-violet-500" />
                                                <span className="text-[10px] text-violet-500/60 font-bold transition-opacity">{'[infrastructure]'}</span>
                                            </div>
                                            <p className="text-xs text-foreground/60">Accept payments in stablecoin - a stablecoin infrastructure.</p>
                                        </a>
                                    </div>
                                    <div className="pl-1 border-l-2 border-green-500/30 group">
                                        <a href="https://avo-snowy.vercel.app" target="_blank" className="block cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold transition-all text-foreground group-hover:text-green-500">AVO</p>
                                                <ExternalLink className="w-3 h-3 transition-colors text-foreground/20 group-hover:text-green-500" />
                                                <span className="text-[10px] text-green-500/60 font-bold transition-opacity">{'[fintech]'}</span>
                                            </div>
                                            <p className="text-xs text-foreground/60">Send crypto via phone numbers with local bank off-ramping.</p>
                                        </a>
                                    </div>
                                    <div className="pl-1 border-l-2 border-blue-500/30 group">
                                        <div className="block cursor-default">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-foreground">Cercu</p>
                                                <span className="text-[10px] text-blue-500/60 font-bold">{'[infrastructure]'}</span>
                                            </div>
                                            <p className="text-xs text-foreground/60">Anchor smart contracts for ROCSA features via NFT & ZKP.</p>
                                        </div>
                                    </div>
                                    <div className="pl-1 border-l-2 border-amber-500/30 group">
                                        <a href="https://brilstack.com" target="_blank" className="block cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold transition-all text-foreground group-hover:text-amber-500">Brilstack</p>
                                                <ExternalLink className="w-3 h-3 transition-colors text-foreground/20 group-hover:text-amber-500" />
                                                <span className="text-[10px] text-amber-500/60 font-bold transition-opacity">{'[recruitment]'}</span>
                                            </div>
                                            <p className="text-xs text-foreground/60">AI-powered recruitment from screening to interviews.</p>
                                        </a>
                                    </div>
                                    <div className="pl-1 border-l-2 border-indigo-500/30 group">
                                        <a href="https://paade.app" target="_blank" className="block cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold transition-all text-foreground group-hover:text-indigo-500">Paade</p>
                                                <ExternalLink className="w-3 h-3 transition-colors text-foreground/20 group-hover:text-indigo-500" />
                                                <span className="text-[10px] text-indigo-500/60 font-bold transition-opacity">{'[discovery]'}</span>
                                            </div>
                                            <p className="text-xs text-foreground/60">Local service discovery and booking platform.</p>
                                        </a>
                                    </div>
                                    <div className="pl-1 border-l-2 border-fuchsia-500/30 group">
                                        <a href="https://novoinno.com" target="_blank" className="block cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold transition-all text-foreground group-hover:text-fuchsia-500">Novoinno</p>
                                                <ExternalLink className="w-3 h-3 transition-colors text-foreground/20 group-hover:text-fuchsia-500" />
                                                <span className="text-[10px] text-fuchsia-500/60 font-bold transition-opacity">{'[logistics]'}</span>
                                            </div>
                                            <p className="text-xs text-foreground/60">Procurement, supplier payments, and shipment logistics.</p>
                                        </a>
                                    </div>
                                    <div className="pl-1 border-l-2 border-teal-500/30 group">
                                        <div className="block cursor-default">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-foreground">Forex Bot</p>
                                                <span className="text-[10px] text-teal-500/60 font-bold">{'[algo-trading]'}</span>
                                            </div>
                                            <p className="text-xs text-foreground/60">Automated trading algorithm built for a private client.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    } else if (currentInput.startsWith('/articles')) {
                        response = (
                            <div className="space-y-4 font-mono">
                                <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">/dev/blog/articles</p>
                                <div className="space-y-3 pl-1">
                                    <a href="https://hackernoon.com/building-a-rest-api-in-go-with-mongodb-integration-a-step-by-step-guide" target="_blank" className="block hover:text-violet-500 transition-colors group">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold transition-all text-foreground group-hover:text-violet-500">Building a REST API in Go with MongoDB</p>
                                            <ExternalLink className="w-3 h-3 transition-colors text-foreground/20 group-hover:text-violet-500" />
                                        </div>
                                        <p className="text-[10px] italic text-foreground/40">HackerNoon • Step-by-step guide</p>
                                    </a>
                                    <p className="text-[10px] italic mt-4 border-t pt-2 border-foreground/5 text-foreground/50">
                                        // new articles coming soon...
                                    </p>
                                </div>
                            </div>
                        );
                    } else if (currentInput.startsWith('/vitals')) {
                        response = (
                            <div className="space-y-4 font-mono">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Activity className="w-4 h-4 text-violet-400" />
                                        <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">/bin/vitals</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[10px] text-foreground/30 uppercase font-bold tracking-tighter">// experience</p>
                                                <p className="text-sm font-bold text-foreground">4+ Years</p>
                                                <p className="text-[11px] text-foreground/50 italic">Backend & Infrastructure</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-foreground/30 uppercase font-bold tracking-tighter">// core_stack</p>
                                                <p className="text-sm font-bold text-foreground">Go, TypeScript, Node.js</p>
                                                <p className="text-[11px] text-foreground/50 italic">Fast, type-safe, scalable</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[10px] text-foreground/30 uppercase font-bold tracking-tighter">// focus</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-foreground">Fintech & Web3</p>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                </div>
                                                <p className="text-[11px] text-foreground/50 italic">Scalable financial systems</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-foreground/30 uppercase font-bold tracking-tighter">// location</p>
                                                <p className="text-sm font-bold text-foreground">Lagos, Nigeria</p>
                                                <p className="text-[11px] text-foreground/50 italic">UTC +1</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-foreground/30 uppercase font-bold tracking-tighter">// availability</p>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500 font-bold border border-violet-500/20">Open to new roles</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 pt-4 border-t border-foreground/5">
                                    <p className="text-[10px] text-foreground/50 leading-relaxed italic">
                                        * Vitals updated in real-time based on local system metrics.
                                    </p>
                                </div>
                            </div>
                        );
                    } else if (currentInput.startsWith('/socials')) {
                        response = (
                            <div className="space-y-3 font-mono">
                                <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">/bin/socials</p>
                                <div className="grid gap-2 pl-1">
                                    {[
                                        { label: 'LinkedIn', icon: <Linkedin className="w-3 h-3" />, url: 'https://linkedin.com/in/oluwaloseyi-adeleye' },
                                        { label: 'GitHub', icon: <Github className="w-3 h-3" />, url: 'https://github.com/seyiadel' },
                                        { label: 'X (Twitter)', icon: <Twitter className="w-3 h-3" />, url: 'https://x.com/seyiadel' },
                                        { label: 'Email', icon: <Mail className="w-3 h-3" />, url: 'mailto:seyiadel03@gmail.com' }
                                    ].map(social => (
                                        <a key={social.label} href={social.url} target="_blank" className="flex items-center gap-2 text-sm transition-colors text-foreground/70 hover:text-foreground">
                                            {social.icon}
                                            <span>{social.label}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    const assistantMsg: Message = {
                        id: Math.random().toString(36).substr(2, 9),
                        role: 'assistant',
                        content: response,
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMsg]);
                    setIsTyping(false);
                }, 700);
            });
        }
    };

    const handleAttachFile = () => {
        const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
        setAttachments((prev: string[]) => [...prev, mockFileName]);
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev: string[]) => prev.filter((_: string, i: number) => i !== index));
    };
    
    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        handleSendMessage(selectedCommand.prefix);
        setShowCommandPalette(false);
    };

    return (
        <div className={cn(
            "min-h-screen flex flex-col w-full items-center justify-center p-6 relative overflow-hidden transition-all duration-500",
            "bg-background text-foreground"
        )}>
            <button 
                onClick={toggleTheme}
                className="absolute top-6 right-6 p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors z-50"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-foreground" />}
            </button>

            <div className="w-full max-w-2xl mx-auto relative">
                <motion.div 
                    className="relative z-10 space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <AnimatePresence>
                        {messages.length === 0 && (
                            <motion.div 
                                className="text-left space-y-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="inline-block"
                                >
                                    <h1 className={cn(
                                        "text-4xl font-mono font-bold tracking-tight pb-1",
                                        theme === 'dark' ? "text-white" : "text-foreground"
                                    )}>
                                        Hi, I'm Seyi Adeleye
                                    </h1>
                                    <motion.div 
                                        className={cn(
                                            "h-0.5 bg-gradient-to-r from-violet-500 to-transparent w-24 rounded-full",
                                            theme === 'dark' ? "opacity-50" : "opacity-30"
                                        )}
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 96, opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.8 }}
                                    />
                                </motion.div>
                                <motion.p 
                                    className={cn(
                                        "text-sm font-mono max-w-lg leading-relaxed",
                                        theme === 'dark' ? "text-white/60" : "text-foreground"
                                    )}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    // Backend engineer focused on building reliable systems and infrastructure that power real-world applications.
                                </motion.p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div 
                        ref={scrollContainerRef}
                        className="max-h-[60vh] overflow-y-auto px-4 py-2 space-y-4 custom-scrollbar scroll-smooth relative z-10"
                    >
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex flex-col w-full text-left font-mono"
                                >
                                    {msg.role === 'user' ? (
                                        <div className="flex items-start gap-2">
                                            <div className="flex items-center gap-1 text-[11px] select-none shrink-0 opacity-70">
                                                <span className="text-green-400 font-bold">seyi</span>
                                                <span className={cn(theme === 'dark' ? "text-white/40" : "text-foreground/40")}>@</span>
                                                <span className="text-violet-400 font-bold">forge-adel</span>
                                                <span className={cn("ml-0.5", theme === 'dark' ? "text-white/70" : "text-foreground/70")}>{'>'}</span>
                                                <span className={cn("ml-1.5 font-bold", theme === 'dark' ? "text-white/50" : "text-foreground/50")}>cat</span>
                                            </div>
                                            <div className="text-sm break-words text-foreground">
                                                {msg.content}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm leading-relaxed pl-1 whitespace-pre-wrap text-foreground">
                                            {msg.content}
                                        </div>
                                    )}
                                    <div className={cn(
                                        "text-[9px] mt-1 pl-1 font-mono tracking-wider",
                                        theme === 'dark' ? "text-white/40" : "text-foreground/70"
                                    )}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 pl-1"
                            >
                                <span className="text-xs text-foreground/30 font-mono italic">executing...</span>
                                <TypingDots />
                            </motion.div>
                        )}
                    </div>

                    <motion.div 
                        className={cn(
                            "relative backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border transition-all duration-500",
                            theme === 'dark' ? "bg-white/[0.02] border-white/[0.1]" : "bg-foreground/[0.03] border-foreground/[0.1]"
                        )}
                        initial={{ scale: 0.98 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className={cn(
                            "flex items-center gap-1.5 px-4 py-2 border-b transition-colors",
                            theme === 'dark' ? "bg-white/[0.03] border-white/[0.05]" : "bg-foreground/[0.03] border-foreground/[0.05]"
                        )}>
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
                            <span className={cn(
                                "ml-2 text-[10px] font-mono tracking-wider uppercase",
                                theme === 'dark' ? "text-white/40" : "text-foreground/80"
                            )}><span className="hidden sm:inline">Seyi_</span>Terminal_v1.0.4</span>
                            <div className="ml-auto flex items-center gap-2 pr-2">
                                <motion.div 
                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/5 border border-violet-500/10"
                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                    <span className={cn(
                                        "text-[9px] font-mono lowercase tracking-tight hidden sm:block",
                                        "text-violet-400/80"
                                    )}>system: online</span>
                                </motion.div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showCommandPalette && (
                                <motion.div 
                                    ref={commandPaletteRef}
                                    className={cn(
                                        "absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl rounded-lg z-50 shadow-lg border overflow-hidden",
                                        theme === 'dark' ? "bg-black/90 border-white/10" : "bg-white/90 border-foreground/10"
                                    )}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="py-1">
                                        {commandSuggestions.map((suggestion, index) => (
                                            <motion.div
                                                key={suggestion.prefix}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                                                    theme === 'dark' 
                                                        ? activeSuggestion === index ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
                                                        : activeSuggestion === index ? "bg-foreground/10 text-foreground" : "text-foreground/70 hover:bg-foreground/5"
                                                )}
                                                onClick={() => selectCommandSuggestion(index)}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 flex items-center justify-center shrink-0",
                                                    theme === 'dark' ? "text-white/60" : "text-foreground/60"
                                                )}>
                                                    {suggestion.icon}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-medium">{suggestion.label}</span>
                                                        <span className={cn(
                                                            "text-[10px] font-mono",
                                                            theme === 'dark' ? "text-white/20" : "text-foreground/20"
                                                        )}>{suggestion.prefix}</span>
                                                    </div>
                                                    <div className={cn(
                                                        "text-[10px] truncate",
                                                        theme === 'dark' ? "text-white/40" : "text-foreground/40"
                                                    )}>
                                                        {suggestion.description}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="px-4 pt-2 pb-0 flex items-start gap-2">
                            <div className="flex items-center gap-1 font-mono text-[11px] pt-[15px] pl-1 select-none shrink-0">
                                <span className="text-green-400/90 font-bold">seyi</span>
                                <span className={cn(theme === 'dark' ? "text-white/30" : "text-foreground/30")}>@</span>
                                <span className="text-violet-400/90 font-bold">forge-adel</span>
                                <span className={cn("ml-0.5", theme === 'dark' ? "text-white/60" : "text-foreground/60")}>{'>'}</span>
                                <span className={cn("ml-1.5 font-bold", theme === 'dark' ? "text-white/40" : "text-foreground/40")}>cat</span>
                                <motion.span
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className={cn(
                                        "ml-0.5 font-bold translate-y-[1px]",
                                        theme === 'dark' ? "text-white/60" : "text-foreground/60",
                                        (inputFocused || value.length > 0) ? "hidden" : "inline-block"
                                    )}
                                >_</motion.span>
                            </div>
                            <Textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    setValue(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder="type / to see list of commands or click below"
                                containerClassName="flex-1"
                                className={cn(
                                    "w-full px-2 py-3 font-mono",
                                    "resize-none",
                                    "bg-transparent",
                                    "border-none",
                                    theme === 'dark' ? "text-white/90" : "text-foreground/90",
                                    "focus:outline-none",
                                    theme === 'dark' ? "placeholder:text-white/50" : "placeholder:text-foreground/70",
                                    "min-h-[44px]"
                                )}
                                style={{
                                    overflow: "hidden",
                                }}
                                showRing={false}
                            />
                        </div>

                        <AnimatePresence>
                            {attachments.length > 0 && (
                                <motion.div 
                                    className="px-3 pb-3 flex gap-2 flex-wrap"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {attachments.map((file: string, index: number) => (
                                        <motion.div
                                            key={index}
                                            className={cn(
                                                "flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg",
                                                theme === 'dark' ? "bg-white/[0.03] text-white/70" : "bg-foreground/[0.03] text-foreground/70"
                                            )}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <span>{file}</span>
                                            <button 
                                                onClick={() => removeAttachment(index)}
                                                className={cn(
                                                    "transition-colors",
                                                    theme === 'dark' ? "text-white/40 hover:text-white" : "text-foreground/40 hover:text-foreground"
                                                )}
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="px-4 pb-3 pt-0 flex items-center justify-end min-h-[48px]">
                            <AnimatePresence>
                                {(value.trim() || isTyping) && (
                                    <motion.button
                                        type="button"
                                        onClick={() => handleSendMessage()}
                                        initial={{ opacity: 0, scale: 0.9, x: 5 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, x: 5 }}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isTyping && !value.trim()}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                                            "flex items-center gap-2",
                                            theme === 'dark' 
                                                ? "bg-white text-[#0A0A0B] shadow-lg shadow-white/20" 
                                                : "bg-[#0A0A0B] text-white shadow-lg shadow-black/20"
                                        )}
                                    >
                                        {isTyping ? (
                                            <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                                        ) : (
                                            <SendIcon className="w-4 h-4" />
                                        )}
                                        <span>Send</span>
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono">
                        {commandSuggestions.map((suggestion, index) => (
                            <motion.button
                                key={suggestion.prefix}
                                onClick={() => selectCommandSuggestion(index)}
                                className={cn(
                                    "flex items-center gap-1.5 text-[12px] transition-colors relative group py-1",
                                    theme === 'dark' ? "text-white/30 hover:text-white" : "text-foreground/30 hover:text-foreground"
                                )}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <span className="opacity-40 group-hover:opacity-100 transition-opacity">{'['}</span>
                                <span className="text-violet-400 group-hover:text-violet-300">$</span>
                                <span className={cn(
                                    "px-0.5 transition-colors",
                                    theme === 'dark' ? "text-white/60 group-hover:text-white" : "text-foreground/80 group-hover:text-foreground"
                                )}>{suggestion.label.toLowerCase()}</span>
                                <span className="opacity-40 group-hover:opacity-100 transition-opacity">{']'}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
                
                <motion.div 
                    className={cn(
                        "mt-12 text-[10px] font-mono tracking-widest uppercase opacity-40 hover:opacity-70 transition-opacity cursor-default",
                        theme === 'dark' ? "text-white" : "text-foreground"
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 1 }}
                >
                    © 2026 Seyi Adeleye.
                </motion.div>
            </div>
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-violet-400 rounded-full mx-0.5"
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                        opacity: [0.3, 0.9, 0.3],
                        scale: [0.85, 1.1, 0.85]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: "0 0 4px rgba(167, 139, 250, 0.3)"
                    }}
                />
            ))}
        </div>
    );
}



const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = rippleKeyframes;
    document.head.appendChild(style);
}
