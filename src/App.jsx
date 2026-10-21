import { useState, useReducer, useCallback } from 'react'
import { agentSessions as initialSessions, activityEvents as seedActivityEvents, plantChannel, plantDemoReducer, initialPlantDemo } from './data'
import NavRail from './components/NavRail'
import ChatList from './components/ChatList'
import ChatView from './components/ChatView'
import ActivityList from './components/ActivityList'
import TitleBar from './components/TitleBar'
import PlantWranglerChannel from './components/PlantWranglerChannel'
import { FreModal } from './components/common'
import './App.css'

export default function App() {
  const [activeView, setActiveView] = useState('chat') // 'chat' | 'activity'
  const [activeChatId, setActiveChatId] = useState(plantChannel.id)
  const [readChatIds, setReadChatIds] = useState(() => new Set([plantChannel.id]))
  const [plantDemo, dispatchPlantDemo] = useReducer(plantDemoReducer, initialPlantDemo)
  const [sessions, setSessions] = useState(initialSessions)
  const [dynamicSessionMessages, setDynamicSessionMessages] = useState({})
  // Activity feed: persist which events the user has opened so unread decorations clear.
  const [activityEvents, setActivityEvents] = useState(seedActivityEvents)
  const [activeActivityId, setActiveActivityId] = useState(null)
  // When navigating to a chat, optionally tell ChatView to open a specific
  // session (sessions rail), open a specific channel thread, or flash a
  // specific message so the user can see where a notification landed.
  const [navIntent, setNavIntent] = useState(null)
  const [showFre, setShowFre] = useState(false)

  const dismissFre = useCallback(() => setShowFre(false), [])

  const selectChat = useCallback((chatId) => {
    setActiveChatId(chatId)
    setReadChatIds(prev => (prev.has(chatId) ? prev : new Set(prev).add(chatId)))
  }, [])

  const navigateToChat = useCallback((chatId, { showSessions, sessionId } = {}) => {
    selectChat(chatId)
    if (showSessions) setNavIntent({ chatId, sessionId: sessionId || null })
  }, [selectChat])

  const clearNavIntent = useCallback(() => setNavIntent(null), [])

  const addSession = useCallback((agentId, session, messages) => {
    setSessions(prev => ({
      ...prev,
      [agentId]: [session, ...(prev[agentId] || [])],
    }))
    if (messages) {
      setDynamicSessionMessages(prev => ({ ...prev, [session.id]: messages }))
    }
  }, [])

  const updateSession = useCallback((agentId, sessionId, updates) => {
    setSessions(prev => ({
      ...prev,
      [agentId]: (prev[agentId] || []).map(s =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    }))
  }, [])

  const updateSessionMessages = useCallback((sessionId, messages) => {
    setDynamicSessionMessages(prev => ({ ...prev, [sessionId]: messages }))
  }, [])

  const selectActivity = useCallback((event) => {
    setActiveActivityId(event.id)
    setActivityEvents(prev =>
      prev.map(e => (e.id === event.id && e.unread ? { ...e, unread: false } : e))
    )
    setActiveChatId(event.chatId)
    setReadChatIds(prev => (prev.has(event.chatId) ? prev : new Set(prev).add(event.chatId)))
    setNavIntent({
      chatId: event.chatId,
      channelThreadPostId: event.postId || null,
      highlightMessageId: event.messageId || null,
    })
  }, [])

  const activityUnreadCount = activityEvents.reduce((n, e) => n + (e.unread ? 1 : 0), 0)

  return (
    <div className="app">
      <TitleBar onShowFre={() => setShowFre(true)} />
      <div className="app-body">
        <NavRail
          activeView={activeView}
          onSelectView={setActiveView}
          activityUnreadCount={activityUnreadCount}
        />
        {activeView === 'activity' ? (
          <ActivityList
            events={activityEvents}
            activeEventId={activeActivityId}
            onSelectEvent={selectActivity}
          />
        ) : (
          <ChatList
            activeChatId={activeChatId}
            onSelectChat={selectChat}
            readChatIds={readChatIds}
          />
        )}
        {activeChatId === plantChannel.id ? (
          <PlantWranglerChannel key={plantDemo.resetVersion} demo={plantDemo} dispatch={dispatchPlantDemo} />
        ) : <ChatView
          activeChatId={activeChatId}
          onSelectChat={navigateToChat}
          sessions={sessions}
          addSession={addSession}
          updateSession={updateSession}
          updateSessionMessages={updateSessionMessages}
          dynamicSessionMessages={dynamicSessionMessages}
          navIntent={navIntent}
          clearNavIntent={clearNavIntent}
        />}
      </div>
      {showFre && (
        <FreModal
          title="Plant Wrangler"
          subtitle="A collaborative manufacturing agent in a shared Teams channel."
          onDismiss={dismissFre}
        >
          <h3 className="fre-section-title">The scenario</h3>
          <p>Caldova has a seven-percent production-capacity shortfall across three plants before launch. Maya asks Plant Wrangler for a grounded Line 3 recovery recommendation in the shared channel.</p>
          <h3 className="fre-section-title">People stay in control</h3>
          <p>Review the capacity answer and its sources. Compare two prepared schedules in the embedded preview, prepare the proposed adjustment for approval, then record Elena’s explicit decision. Plant Wrangler confirms the agreed plan without changing production.</p>
          <h3 className="fre-section-title">Recording controls</h3>
          <p>Follow the three-minute Ask → Check and answer → Explore → Decide → Confirm timeline. Use the prepared question, schedule widget and approval card, or Next scene. Reset demo restores the opening state; all source snapshots and timestamps are fixed.</p>
          <p className="fre-modal-footnote">Everything is fictional and local. Access scoping, identities, approvals, meeting invitations and execution evidence are simulated. No production services are connected.</p>
        </FreModal>
      )}
    </div>
  )
}
