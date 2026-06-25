import React, { useEffect, useState, useRef } from 'react'
import { apiFetch } from '../api/client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import {
  MessageSquare,
  Send,
  Search,
  Loader2,
  ExternalLink,
  ChevronLeft,
  User
} from 'lucide-react'

interface Patient {
  id: number
  full_name: string
  email: string
  role: string
  consent_given: boolean
}

interface Message {
  id: number
  sender_id: number
  receiver_id: number
  message: string
  is_read: boolean
  created_at: string
}

interface ClinicianChatHubProps {
  patients: Patient[]
  onSelectPatient: (patient: Patient) => void
  unreadCounts: Record<number, number>
  setUnreadCounts: React.Dispatch<React.SetStateAction<Record<number, number>>>
  socket: WebSocket | null
  currentUserId: number
  onActivePatientChange?: (id: number | null) => void
}

export function ClinicianChatHub({
  patients,
  onSelectPatient,
  unreadCounts,
  setUnreadCounts,
  socket,
  currentUserId,
  onActivePatientChange
}: ClinicianChatHubProps) {
  const [activePatient, setActivePatient] = useState<Patient | null>(null)

  const handleSelectActivePatient = (patient: Patient) => {
    setActivePatient(patient)
    if (onActivePatientChange) {
      onActivePatientChange(patient.id)
    }
  }

  const handleBackToList = () => {
    setActivePatient(null)
    if (onActivePatientChange) {
      onActivePatientChange(null)
    }
  }

  useEffect(() => {
    return () => {
      if (onActivePatientChange) {
        onActivePatientChange(null)
      }
    }
  }, [])

  const [messages, setMessages] = useState<Message[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchChatHistory = async (patientId: number) => {
    setLoadingHistory(true)
    try {
      const history = await apiFetch<Message[]>(`/api/chat/direct/history/${patientId}`)
      if (history) {
        setMessages(history)
      }
      await apiFetch(`/api/chat/direct/read/${patientId}`, { method: 'PATCH' })
      setUnreadCounts(prev => ({ ...prev, [patientId]: 0 }))
    } catch (err) {
      console.error("Error loading clinician-patient chat history:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (activePatient) {
      fetchChatHistory(activePatient.id)
    }
  }, [activePatient])

  useEffect(() => {
    if (!socket) return

    const handleSocketMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data)
        if (activePatient && (
          (msg.sender_id === activePatient.id && msg.receiver_id === currentUserId) ||
          (msg.sender_id === currentUserId && msg.receiver_id === activePatient.id)
        )) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          if (msg.sender_id === activePatient.id) {
            apiFetch(`/api/chat/direct/read/${activePatient.id}`, { method: 'PATCH' })
          }
        }
      } catch (err) {
        console.error("Error parsing websocket message in clinician hub:", err)
      }
    }

    socket.addEventListener('message', handleSocketMessage)
    return () => {
      socket.removeEventListener('message', handleSocketMessage)
    }
  }, [socket, activePatient, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loadingHistory])

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activePatient || !socket) return
    const payload = { receiver_id: activePatient.id, message: messageInput.trim() }
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload))
      setMessageInput("")
    } else {
      alert("Chat connection is offline. Please wait a moment or reload the dashboard.")
    }
  }

  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-12rem)] min-h-[500px] bg-white border border-outline-variant rounded-2xl shadow-sm flex overflow-hidden animate-in fade-in duration-300">

      {/* ── Left Sidebar: Contact list ───────────────────────────────────── */}
      {/* On mobile: visible only when NO chat is open. On lg+: always visible. */}
      <div className={`
        flex-col shrink-0 border-r border-outline-variant bg-surface-bright/20
        w-full lg:w-80
        ${activePatient ? 'hidden lg:flex' : 'flex'}
      `}>
        {/* Header / Search */}
        <div className="p-4 border-b border-outline-variant flex flex-col gap-3">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Patient Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant text-xs focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Scrollable Contacts */}
        <ScrollArea className="flex-grow">
          <div className="p-2 space-y-1">
            {filteredPatients.length === 0 ? (
              <div className="py-12 text-center text-xs text-on-surface-variant font-medium">
                No patients found
              </div>
            ) : (
              filteredPatients.map(patient => {
                const isSelected = activePatient?.id === patient.id
                const unreadCount = unreadCounts[patient.id] || 0
                const initials = patient.full_name
                  ? patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'P'

                return (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectActivePatient(patient)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border-none cursor-pointer ${isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'bg-transparent text-on-surface hover:bg-slate-100/60'
                      }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-primary shrink-0 border border-primary/10">
                      {initials}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs truncate leading-snug font-semibold">{patient.full_name}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium truncate mt-0.5">{patient.email}</p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-primary text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>

      {/* ── Right Area: Active Chat ───────────────────────────────────────── */}
      {/* On mobile: visible only when a chat IS open. On lg+: always visible. */}
      <div className={`
        flex-grow flex-col bg-background
        ${activePatient ? 'flex' : 'hidden lg:flex'}
      `}>
        {activePatient ? (
          <>
            {/* Conversation Header */}
            <div className="px-4 py-3 border-b border-outline-variant bg-white flex justify-between items-center h-14 flex-shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* Back button – mobile only */}
                <button
                  onClick={handleBackToList}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-on-surface-variant transition-colors shrink-0"
                  aria-label="Back to contacts"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0 font-extrabold text-xs">
                  {activePatient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-black text-on-surface truncate leading-tight">{activePatient.full_name}</h3>
                  <p className="text-[9px] text-on-surface-variant truncate font-medium">{activePatient.email}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="xs"
                onClick={() => onSelectPatient(activePatient)}
                className="text-secondary hover:bg-secondary/10 font-bold text-[10px] flex items-center gap-1 h-8 rounded-lg px-2.5 shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View Medical Profile</span>
                <span className="sm:hidden">Profile</span>
              </Button>
            </div>

            {/* Scrollable Messages */}
            <ScrollArea className="flex-grow bg-slate-50/40 w-full overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 flex flex-col">
                {loadingHistory ? (
                  <div className="py-20 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Loading patient chat logs...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-24 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center gap-3 px-6 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">Secure Consultation Channel</p>
                      <p className="mt-1 leading-relaxed">No chat records yet. Send a message to start remote consultation with {activePatient.full_name}.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((msg, idx) => {
                      const isCurrentUser = msg.sender_id === currentUserId
                      return (
                        <div
                          key={msg.id || idx}
                          className={`p-3 rounded-2xl max-w-[85%] sm:max-w-[75%] text-xs leading-relaxed shadow-xs flex flex-col ${isCurrentUser
                              ? 'bg-primary text-white self-end rounded-tr-none'
                              : 'bg-white text-on-surface self-start rounded-tl-none border border-outline-variant/50'
                            }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <span className="text-[8px] mt-1 block text-right font-medium opacity-75">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Chat Input Footer */}
            <div className="p-3 sm:p-4 border-t border-outline-variant bg-white flex gap-2 items-center flex-shrink-0">
              <Input
                type="text"
                placeholder={`Message ${activePatient.full_name.split(' ')[0]}...`}
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                disabled={loadingHistory}
                className="flex-grow bg-surface-container-low border-outline-variant text-xs h-9"
              />
              <Button
                onClick={handleSendMessage}
                disabled={loadingHistory || !messageInput.trim()}
                className="rounded-xl px-4 bg-primary hover:bg-primary/95 text-white border-none cursor-pointer h-9 shrink-0 flex items-center justify-center"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        ) : (
          /* Empty State – visible on lg+ when no patient selected */
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center text-primary border border-primary/10 mb-4">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-sm text-on-surface">Secure Direct Messenger</h3>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              Consult with your cardiac or diabetic patients instantly. Choose a patient from the list to review messages and coordinate dietary interventions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
