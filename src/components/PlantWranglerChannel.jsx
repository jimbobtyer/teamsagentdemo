import { useEffect, useMemo, useRef, useState } from 'react'
import {
  plantChannel, plantParticipants, plantPosts, plantQuestions,
  plantAnswerRows, plantScheduleOptions, plantSceneLabels, plantSources, getPlantReplies,
} from '../data'
import { Avatar, CheckCircle, Close, IconButton, Send, TypingIndicator } from './common'
import ChatHeader from './ChatHeader'
import ChannelThreadRail from './ChannelThreadRail'
import MessageRow from './MessageRow'
import './ChatView.css'
import './PlantWranglerChannel.css'

const agent = plantParticipants.find((person) => person.isAgent)
const maya = plantParticipants[0]
const elena = plantParticipants[1]
const scrollTargets = {
  ready: 'pw-launch', checking: 'pw-progress', procedure: 'pw-progress',
  streaming: 'pw-plant-answer', plant: 'pw-plant-answer', exploring: 'pw-options',
  approval: 'pw-approval', approved: 'pw-approval', confirmed: 'pw-completed',
}

function CitationLinks({ onOpenSource }) {
  return (
    <div className="pw-citations" aria-label="Supporting evidence">
      <span className="pw-eyebrow">Supporting evidence</span>
      {plantSources.map((source, index) => (
        <button type="button" key={source.id} onClick={() => onOpenSource(source.id)}>
          <span className="pw-citation-number">{index + 1}</span>{source.title}
        </button>
      ))}
    </div>
  )
}

function ScheduleWidget({ demo, onSelect, onPrepare }) {
  const selected = plantScheduleOptions.find((option) => option.id === demo.selectedOption)
  const locked = demo.stage !== 'exploring'
  return (
    <section className="pw-option-widget" aria-labelledby="pw-option-title">
      <div className="pw-section-heading">
        <h3 id="pw-option-title">Line 3 · Schedule options</h3>
        <span className="pw-local-label">Interactive preview</span>
      </div>
      <p className="pw-small">Prepared data · 91% required · 4,000-unit rated weekly baseline</p>
      <fieldset className="pw-option-choices" disabled={locked}>
        <legend>Choose a schedule to explore</legend>
        {plantScheduleOptions.map((option) => (
          <label className={`pw-option ${demo.selectedOption === option.id ? 'pw-option-selected' : ''}`} key={option.id}>
            <span className="pw-option-heading"><input type="radio" name="pw-schedule" value={option.id}
              checked={demo.selectedOption === option.id} onChange={() => onSelect(option.id)} />{option.title}</span>
            <strong className="pw-option-capacity">{option.capacity}</strong>
            <span className="pw-option-gap">{option.gap}</span>
            <span className="pw-option-description">{option.description}</span>
          </label>
        ))}
      </fieldset>
      <dl className="pw-facts pw-option-facts" aria-live="polite">
        <div><dt>Selected plan</dt><dd>{selected.title}</dd></div>
        <div><dt>Overtime</dt><dd>{selected.shift}</dd></div>
        <div><dt>Changeover</dt><dd>{selected.changeover}</dd></div>
        <div><dt>Incremental cost</dt><dd>{selected.cost}</dd></div>
      </dl>
      {!locked && (
        <>
          <button type="button" className="pw-button pw-button-primary" disabled={selected.id !== 'adjustment'} onClick={onPrepare}>Prepare for approval</button>
          <p className="pw-small" role="status">{demo.optionError || (selected.id === 'current'
            ? 'The current schedule leaves a 9 pp gap. Select the proposed adjustment to prepare approval.'
            : 'Ready to prepare. Elena must make the explicit approval decision.')}</p>
        </>
      )}
      {locked && <p className="pw-small">{demo.approvedBy ? 'Selected plan approved by Elena Torres.' : 'Selected plan sent to Elena for approval.'}</p>}
      <p className="pw-disclaimer">Local HTML interaction, not a connected Teams widget. Choosing a plan never changes production.</p>
    </section>
  )
}

function DecisionLog({ approved, scheduled, onOpenSource, panelRef }) {
  return (
    <section ref={panelRef} className="pw-decision-log" aria-labelledby="pw-decision-title">
      <div className="pw-section-heading">
        <h2 id="pw-decision-title">Decision log</h2>
        <span className="pw-local-label">Local mock</span>
      </div>
      {approved ? (
        <>
          <h3>Approve Line 3 overtime</h3>
          <dl className="pw-facts">
            <div><dt>Owner</dt><dd>Elena Torres</dd></div>
            <div><dt>Status</dt><dd className="pw-success-text">Approved · Mon 9:47 AM PT</dd></div>
            <div><dt>Selected plan</dt><dd>Proposed adjustment · 91% planned capacity</dd></div>
            <div><dt>Production schedule</dt><dd>Not changed by approval</dd></div>
            <div><dt>Meeting</dt><dd>{scheduled ? 'Scheduled (local mock)' : 'Not scheduled'}</dd></div>
          </dl>
          <details className="pw-log-sources">
            <summary>Evidence: 3 linked sources</summary>
            <CitationLinks onOpenSource={onOpenSource} />
          </details>
        </>
      ) : (
        <div className="pw-log-empty">
          <CheckCircle size={20} />
          <div><strong>No decisions recorded yet</strong><p>Human approvals and their evidence will appear here.</p></div>
        </div>
      )}
    </section>
  )
}

function ProductionConcept() {
  return (
    <details className="pw-concept">
      <summary>How this would connect in production <span className="pw-local-label">Conceptual</span></summary>
      <p>Illustrative architecture—not a connected system.</p>
      <ol className="pw-concept-flow">
        {[
          ['Teams collaborative experience', 'Shared questions, recommendations and human decisions'],
          ['Orchestration layer', 'Coordinates bounded tasks and handoffs'],
          ['Governed knowledge and operating data', 'Retrieves permitted evidence and capacity snapshots'],
          ['Approvals and actions', 'Named owners approve consequential changes'],
          ['Evidence and observability', 'Records sources, decisions and action outcomes'],
        ].map(([title, description]) => <li key={title}><strong>{title}</strong><span>{description}</span></li>)}
      </ol>
      <details className="pw-concept-examples">
        <summary>Example service mapping</summary>
        <ul>
          <li>Microsoft Copilot Studio for orchestration</li>
          <li>Foundry IQ for governed knowledge and citations</li>
          <li>Fabric IQ for capacity, scheduling and telemetry data</li>
          <li>Work IQ for Microsoft 365 context</li>
          <li>Power Automate or agent flows for approvals and follow-up actions</li>
          <li>SharePoint for a decision log</li>
        </ul>
      </details>
      <p className="pw-disclaimer">These services are represented conceptually and are not connected in this prototype. Teams is the collaborative surface, not the policy or orchestration layer.</p>
    </details>
  )
}

function DemoDialog({ modal, onClose, onApprove, onSaveMeeting, onSelectSource }) {
  const dialogRef = useRef(null)
  const [meetingTime, setMeetingTime] = useState(modal.meetingTime || '09:00')
  const [actorId, setActorId] = useState(elena.id)
  const decisionActor = plantParticipants.find((person) => person.id === actorId)
  const source = plantSources.find((item) => item.id === modal.sourceId)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    dialog.showModal()
    return () => {
      dialog.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="pw-dialog"
      aria-labelledby="pw-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <div className="pw-dialog-header">
        <div>
          <span className="pw-eyebrow">{modal.kind === 'source' ? 'Grounded evidence · local fixture' : 'Human control · simulated action'}</span>
          <h2 id="pw-dialog-title">{modal.kind === 'source' ? 'Source details' : modal.kind === 'approve' ? 'Elena’s overtime decision' : 'Edit meeting details'}</h2>
        </div>
        <IconButton label="Close dialog" onClick={onClose}><Close size={20} /></IconButton>
      </div>
      {modal.kind === 'source' && (
        <div className="pw-dialog-body">
          <div className="pw-source-tabs" aria-label="Choose a source">
            {plantSources.map((item, index) => (
              <button type="button" key={item.id} aria-pressed={item.id === source.id}
                onClick={() => onSelectSource(item.id)}>{index + 1}. {item.title}</button>
            ))}
          </div>
          <span className="pw-local-label">{source.kind}</span>
          <h3>{source.title}</h3>
          <p className="pw-source-summary">{source.summary}</p>
          <dl className="pw-facts">
            <div><dt>Owner</dt><dd>{source.owner}</dd></div>
            <div><dt>Version</dt><dd>{source.version}</dd></div>
            <div><dt>Updated</dt><dd>{source.updated}</dd></div>
            <div><dt>Location</dt><dd>{source.location}</dd></div>
            {source.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          <p className="pw-disclaimer">Fictitious source information, stored locally. No documents or external services are being retrieved.</p>
        </div>
      )}
      {modal.kind === 'approve' && (
        <div className="pw-dialog-body">
          <div className="pw-acting-as"><Avatar contact={decisionActor} size={32} /><div><strong>{decisionActor.name}</strong><span>{decisionActor.role} · simulated decision maker</span></div></div>
          <label className="pw-field">Acting as (demo identity)
            <select value={actorId} onChange={(event) => setActorId(Number(event.target.value))}>
              {plantParticipants.filter((person) => !person.isAgent).map((person) => <option key={person.id} value={person.id}>{person.name} · {person.role}</option>)}
            </select>
          </label>
          <p className={actorId === elena.id ? 'pw-small' : 'pw-change-note'} role="status">{actorId === elena.id
            ? 'Local approval rule: Elena Torres is the named approver for this request.'
            : 'Approval unavailable. Only Elena Torres is the named approver for this request.'}</p>
          <p>Approve Line 3 overtime for Saturday, 06:00–14:00, at an estimated incremental cost of <strong>$18,400</strong>?</p>
          <p>The decision will be attributed to Elena, not Plant Wrangler. Staffing and maintenance coverage will be confirmed at change control.</p>
          <p className="pw-disclaimer">The local app checks the selected demo actor before recording approval. This is not authenticated identity or production authorization. No shift is booked.</p>
        </div>
      )}
      {modal.kind === 'meeting' && (
        <form id="pw-meeting-form" className="pw-dialog-body" onSubmit={(event) => { event.preventDefault(); onSaveMeeting(meetingTime) }}>
          <h3>Line 3 launch capacity change control</h3>
          <label className="pw-field">Tuesday, Oct 20 · start time (PT)
            <select value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)}>
              <option value="09:00">09:00–09:30</option>
              <option value="10:00">10:00–10:30</option>
            </select>
          </label>
          <p>Maya Chen, Elena Torres, Nora Singh and David Okafor · Microsoft Teams</p>
          <p className="pw-disclaimer">The four-item change-control agenda stays attached. This changes the local meeting preview only.</p>
        </form>
      )}
      <div className="pw-dialog-footer">
        <button type="button" className="pw-button" onClick={onClose}>{modal.kind === 'source' ? 'Done' : 'Cancel'}</button>
        {modal.kind === 'approve' && <button type="button" className="pw-button pw-button-primary" disabled={actorId !== elena.id} onClick={() => onApprove(actorId)}>Confirm approval as Elena Torres</button>}
        {modal.kind === 'meeting' && <button type="submit" form="pw-meeting-form" className="pw-button pw-button-primary">Save details</button>}
      </div>
    </dialog>
  )
}

export default function PlantWranglerChannel({ demo, dispatch }) {
  const [threadPostId, setThreadPostId] = useState('pw-launch')
  const [threadOpen, setThreadOpen] = useState(true)
  const [modal, setModal] = useState(null)
  const [input, setInput] = useState(demo.stage === 'ready' ? plantQuestions.plant : '')
  const [inputStage, setInputStage] = useState(`${demo.stage}:pw-launch`)
  const [localReplies, setLocalReplies] = useState({})
  const [notice, setNotice] = useState('')
  const [evidenceExpanded, setEvidenceExpanded] = useState(demo.evidenceVisible)
  const [evidenceCursor, setEvidenceCursor] = useState(demo.evidenceVisible)
  const [stageCursor, setStageCursor] = useState(demo.stage)
  const [focusTarget, setFocusTarget] = useState(scrollTargets[demo.stage])
  const decisionLogRef = useRef(null)
  const approved = demo.approvedBy === elena.id
  const scheduled = demo.meetingScheduled
  const busy = ['checking', 'procedure', 'streaming'].includes(demo.stage)
  const isWorkflow = threadPostId === 'pw-launch'
  const asking = isWorkflow && demo.stage === 'ready'
  const actor = maya
  const composeKey = `${demo.stage}:${threadPostId}`

  if (inputStage !== composeKey) {
    setInputStage(composeKey)
    setInput(asking ? plantQuestions.plant : '')
    setNotice('')
  }
  if (stageCursor !== demo.stage) {
    setStageCursor(demo.stage)
    setFocusTarget(scrollTargets[demo.stage])
  }
  if (evidenceCursor !== demo.evidenceVisible) {
    setEvidenceCursor(demo.evidenceVisible)
    if (demo.evidenceVisible) setEvidenceExpanded(true)
  }

  useEffect(() => {
    const steps = { checking: ['review-procedure', 1100], procedure: ['start-answer', 1100], streaming: ['stream-row', 700] }
    const step = steps[demo.stage]
    if (!step) return
    const timer = setTimeout(() => dispatch({ type: step[0] }), step[1])
    return () => clearTimeout(timer)
  }, [demo.stage, demo.answerRows, dispatch])

  useEffect(() => {
    if (demo.stage === 'approved' || demo.stage === 'confirmed') {
      decisionLogRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
    }
  }, [demo.stage])

  const posts = useMemo(() => plantPosts.map((post) => ({
    ...post,
    replies: [...(post.id === 'pw-launch' ? getPlantReplies(demo) : post.replies), ...(localReplies[post.id] || [])],
  })), [demo, localReplies])

  const openSource = (sourceId = 'capacity') => setModal({ kind: 'source', sourceId })
  const openWorkflow = () => { setThreadOpen(true); setThreadPostId('pw-launch') }
  const act = (type) => { openWorkflow(); dispatch({ type }) }

  const cardAction = (action) => {
    if (action === 'evidence') openSource()
    else if (action === 'approve') setModal({ kind: 'approve' })
    else if (action === 'changes') {
      dispatch({ type: 'request-changes' })
      setNotice('Elena requested an explicit staffing checkpoint. No overtime has been approved.')
    } else if (action === 'resubmit') {
      dispatch({ type: 'resubmit' })
      setNotice('Request revised: staffing confirmation is required at change control. Elena can now review again.')
    } else if (action === 'schedule') {
      dispatch({ type: 'schedule' })
      setNotice('Meeting scheduled locally. Agenda included; no real invitation was sent.')
    }
    else if (action === 'edit') setModal({ kind: 'meeting', meetingTime: demo.meetingTime })
  }

  const nextScene = () => {
    openWorkflow()
    setFocusTarget(scrollTargets[demo.stage])
    const nextActions = { ready: 'ask', checking: 'review-procedure', procedure: 'start-answer', streaming: 'answer', plant: 'explore', approved: 'confirm' }
    if (demo.stage === 'approval') {
      if (demo.changesRequested) cardAction('resubmit')
      else cardAction('approve')
    } else if (demo.stage === 'exploring') {
      if (demo.selectedOption === 'current') dispatch({ type: 'select-option', optionId: 'adjustment' })
      else dispatch({ type: 'request-approval' })
    } else if (nextActions[demo.stage]) dispatch({ type: nextActions[demo.stage] })
  }

  const send = (event) => {
    event.preventDefault()
    const text = input.trim()
    if (!text) {
      setNotice('Add a reply before sending.')
      return
    }
    if (asking) {
      if (text !== plantQuestions.plant) {
        setNotice('This is a scripted prototype. Use the prepared question below to continue; no live agent is connected.')
        return
      }
      act('ask')
    } else {
      const reply = { id: `pw-local-${threadPostId}-${(localReplies[threadPostId]?.length || 0) + 1}`, senderId: 101, time: '9:50 AM', text }
      setLocalReplies((previous) => ({ ...previous, [threadPostId]: [...(previous[threadPostId] || []), reply] }))
      setFocusTarget(reply.id)
      setNotice('Reply added locally. Scripted decisions are made using the cards.')
      setInput('')
    }
  }

  const renderDetails = (message) => {
    if (message.plantDetail === 'progress') return (
      <div className="pw-work-status" role="status">
        <span className="pw-local-label">Work status</span>
        <span>{busy ? 'Using prepared capacity and procedure snapshots.' : 'Capacity plan and CP-17 reviewed.'}</span>
      </div>
    )
    if (message.plantDetail === 'plant') return (
      <div className="pw-formatted-answer" aria-busy={demo.stage === 'streaming'}>
        <table>
          <caption>Line 3 · Capacity, constraints and sources</caption>
          <thead><tr><th scope="col">Capacity</th><th scope="col">Constraint</th><th scope="col">Source</th></tr></thead>
          <tbody>
            {plantAnswerRows.map((row, index) => {
              const source = plantSources.find((item) => item.id === row.sourceId)
              const visible = demo.answerRows > index
              return (
                <tr key={row.id}>
                  <th scope="row">{visible ? row.capacity : <span className="pw-answer-placeholder">Receiving…</span>}</th>
                  <td>{visible ? row.constraint : <span className="pw-answer-placeholder">—</span>}</td>
                  <td>{visible ? <button type="button" className="pw-source-reference" aria-label={`Open ${source.title}`} onClick={() => openSource(source.id)}>[{index + 1}]</button> : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="pw-answer-summary" aria-live="polite">
          {demo.stage === 'streaming' ? <p>Receiving the prepared answer…</p> : (
            <>
              <p><strong>Planned capacity: 91%.</strong> The proposed +9 pp covers the rush-order gap.</p>
              <p><strong>{approved ? 'High confidence after Elena’s approval.' : 'Medium confidence until overtime is approved.'}</strong> Staffing and maintenance coverage still need confirmation.</p>
            </>
          )}
        </div>
        <div className="pw-scope">Plant-level view · Requested by Maya Chen · 4,000-unit weekly rated baseline</div>
        {demo.stage !== 'streaming' && <CitationLinks onOpenSource={openSource} />}
        {demo.stage === 'plant' && <button type="button" className="pw-button pw-button-primary pw-prepare-approval" onClick={() => act('explore')}>Explore schedule options</button>}
      </div>
    )
    if (message.plantDetail === 'options') return (
      <ScheduleWidget demo={demo} onSelect={(optionId) => dispatch({ type: 'select-option', optionId })}
        onPrepare={() => act('request-approval')} />
    )
    if (message.plantDetail === 'network') return (
      <div className="pw-network">
        <div className="pw-scope pw-scope-network">Network manufacturing view · David Okafor</div>
        <p className="pw-small">Response scoped to your access · visual simulation</p>
        <table>
          <caption>Launch-week output · units</caption>
          <thead><tr><th scope="col">Plant</th><th scope="col">Available</th><th scope="col">Required</th><th scope="col">Gap</th></tr></thead>
          <tbody>
            <tr><th scope="row">Vancouver</th><td>3,280</td><td>3,640</td><td>360</td></tr>
            <tr><th scope="row">Monterrey</th><td>4,550</td><td>4,800</td><td>250</td></tr>
            <tr><th scope="row">Brno</th><td>1,470</td><td>1,560</td><td>90</td></tr>
          </tbody>
          <tfoot><tr><th scope="row">Network</th><td>9,300</td><td>10,000</td><td>700</td></tr></tfoot>
        </table>
        <p className="pw-small">Line 3’s 9 pp uses rated capacity; the network’s 7% uses launch demand. Different denominators, not conflicting estimates.</p>
        <p><strong>Next:</strong> approve the Vancouver recovery separately. Monterrey and Brno need their own local recovery plans.</p>
        <CitationLinks onOpenSource={openSource} />
        <p className="pw-disclaimer">Access-aware answer is simulated. No real authentication or authorization is implemented.</p>
      </div>
    )
    if (message.plantDetail === 'approval' && demo.changesRequested) return (
      <div className="pw-change-note">Staffing must be confirmed at change control before the approved shift runs. Shift hours and estimated cost are unchanged.</div>
    )
    if (message.plantDetail === 'decision') return (
      <>
        {demo.stage === 'approved' && <button type="button" className="pw-button pw-button-primary pw-prepare-approval" onClick={() => act('confirm')}>Post agreed plan</button>}
        {demo.decisionError && <p className="pw-change-note" role="alert">{demo.decisionError}</p>}
      </>
    )
    if (message.plantDetail === 'completed') return (
      <>
        <CitationLinks onOpenSource={openSource} />
        <p className="pw-small">Elena’s decision and its three sources are recorded in this shared thread and the local decision log.</p>
        <details className="pw-run-evidence" open={evidenceExpanded} onToggle={(event) => setEvidenceExpanded(event.currentTarget.open)}>
        <summary><CheckCircle size={16} />Execution evidence<span className="pw-local-label">Simulated</span></summary>
        <dl className="pw-facts">
          <div><dt>Request correlation ID</dt><dd><code>PW-20261019-0940-C7A2</code></dd></div>
          <div><dt>Requesting user</dt><dd>Maya Chen · operations manager</dd></div>
          <div><dt>Access scope</dt><dd>Vancouver / Line 3{demo.networkVisible ? '; David’s network follow-up (simulated)' : ''}</dd></div>
          <div><dt>Sources retrieved</dt><dd>3 local source fixtures</dd></div>
          <div><dt>Approval decision</dt><dd>Approved by Elena Torres · Mon 9:47 AM PT</dd></div>
          <div><dt>Actor check</dt><dd>Local rule: selected demo actor matches named approver Elena Torres. No authenticated identity.</dd></div>
          <div><dt>Selected option</dt><dd>Proposed adjustment · 91% planned capacity</dd></div>
          <div><dt>Production action</dt><dd>None. Approval did not change the production schedule.</dd></div>
          <div><dt>Meeting action</dt><dd>{scheduled ? `Scheduled locally by Maya Chen · Tuesday ${demo.meetingTime} PT · agenda included` : 'Not scheduled; optional follow-up only'}</dd></div>
          <div><dt>Status</dt><dd className="pw-success-text">Completed with human approval</dd></div>
        </dl>
        <CitationLinks onOpenSource={openSource} />
        <p className="pw-disclaimer">Illustrative trace only. No identity provider, retrieval service, approval system, calendar or telemetry backend is connected.</p>
        </details>
        <details className="pw-follow-up">
          <summary>Optional follow-up</summary>
          {!demo.meetingVisible && <button type="button" className="pw-button" onClick={() => { dispatch({ type: 'show-meeting' }); setFocusTarget('pw-meeting') }}>Prepare change-control meeting</button>}
          {!demo.networkVisible && <button type="button" className="pw-button" onClick={() => { dispatch({ type: 'network' }); setFocusTarget('pw-network-answer') }}>Ask David’s network question</button>}
        </details>
      </>
    )
    return null
  }

  const composeContent = (
    <div className="pw-thread-footer">
      <div className="pw-progress-slot" role="status">
        {busy ? <><TypingIndicator contact={agent} avatarSize={24} /><span>{demo.stage === 'checking' ? 'Checking capacity' : demo.stage === 'procedure' ? 'Reviewing changeover procedure' : 'Receiving capacity, constraints and sources…'}</span></>
          : <span>{demo.stage === 'approval' ? 'Elena’s approval is required. Use the decision card above.' : approved ? 'People own the decisions. Plant Wrangler coordinates the follow-up.' : 'Shared channel thread · everyone can follow the conversation'}</span>}
      </div>
      <form className="pw-reply-form" onSubmit={send}>
        <label className="pw-compose-identity" htmlFor="pw-reply">
          <Avatar contact={actor} size={20} hideStatus />
          <span>Reply as <strong>{actor.name}</strong></span>
          <span className="pw-local-label">Demo role</span>
        </label>
        <div className="pw-compose-box">
          <textarea id="pw-reply" rows={2} value={input} disabled={busy}
            placeholder={asking ? 'Use the prepared question' : 'Reply to this shared thread'}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) send(event) }} />
          <IconButton label={`Send reply as ${actor.name}`} disabled={busy} onClick={send}><Send size={20} /></IconButton>
        </div>
        {notice && <p className="pw-compose-notice" role="status">{notice}</p>}
        {asking && input !== plantQuestions.plant && (
          <button type="button" className="pw-text-button" onClick={() => { setInput(plantQuestions.plant); setNotice('') }}>Use prepared question</button>
        )}
      </form>
      <div className="pw-demo-controls">
        <span aria-live="polite">{plantSceneLabels[demo.stage]}</span>
        <button type="button" onClick={() => dispatch({ type: 'reset' })}>Reset demo</button>
        <button type="button" disabled={demo.stage === 'confirmed'} onClick={nextScene}>Next scene <span aria-hidden="true">→</span></button>
      </div>
    </div>
  )

  return (
    <div className="chat-view plant-wrangler">
      <main className="chat-view-main">
        <ChatHeader activeContact={plantChannel} isChannel showThreads={threadOpen}
          onToggleThreads={() => setThreadOpen((open) => !open)} />
        <div className="pw-channel-body">
          <div className="pw-channel-context">
            <div className="pw-channel-kicker">CALDOVA · MANUFACTURING</div>
            <div className="pw-context-title"><h1>One launch. Three plants.</h1><span className="pw-risk-badge">7% capacity shortfall</span></div>
            <p>Launch · Monday, Oct 26 <span aria-hidden="true">·</span> Decisions stay with the team</p>
          </div>
          <section className="pw-agent-intro" aria-label="Channel agent">
            <Avatar contact={agent} size={36} />
            <div><strong>Plant Wrangler <span className="message-ai-badge">Agent</span></strong><p>Third-party manufacturing agent · shared context, grounded recommendations</p></div>
          </section>
          <div className="pw-posts">
            <div className="pw-date-divider">Monday, October 19 · all times PT</div>
            {posts.map((post) => (
              <div key={post.id} className={post.id === 'pw-launch' ? 'pw-active-post' : ''}>
                <MessageRow activeContact={plantChannel}
                  message={{ ...post, threadReply: post.replies.length ? { count: post.replies.length, participantIds: [...new Set(post.replies.map((reply) => reply.senderId))].slice(-3) } : undefined }}
                  onOpenThread={() => { setThreadPostId(post.id); setThreadOpen(true) }} />
                {!post.replies.length && <button className="pw-text-button pw-reply-link" type="button" onClick={() => { setThreadPostId(post.id); setThreadOpen(true) }}>Reply in thread</button>}
                {post.id === 'pw-launch' && <button type="button" className="pw-open-workflow" onClick={openWorkflow}>Open shared capacity thread <span aria-hidden="true">→</span></button>}
              </div>
            ))}
          </div>
          <DecisionLog panelRef={decisionLogRef} approved={approved} scheduled={scheduled} onOpenSource={openSource} />
          <section className="pw-participants" aria-labelledby="pw-people-title">
            <h2 id="pw-people-title">Working together in this channel</h2>
            <div>{plantParticipants.map((person) => (
              <div key={person.id} className="pw-participant"><Avatar contact={person} size={24} hideStatus /><span>{person.name}<small>{person.role}</small></span></div>
            ))}</div>
          </section>
          <ProductionConcept />
        </div>
        <div className="pw-prototype-note">Fictional scenario · local interactive prototype · no production services connected</div>
        {!threadOpen && <div className="pw-closed-controls"><button type="button" className="pw-button" onClick={openWorkflow}>Open shared thread</button><button type="button" className="pw-text-button" onClick={nextScene}>Next scene</button><button type="button" className="pw-text-button" onClick={() => dispatch({ type: 'reset' })}>Reset demo</button></div>}
      </main>
      {threadOpen && (
        <ChannelThreadRail
          posts={posts} initialPostId={threadPostId} activeContact={plantChannel}
          onClose={() => setThreadOpen(false)} onCardAction={cardAction} onSelectPost={setThreadPostId}
          renderMessageDetails={renderDetails}
          composeContent={composeContent}
          scrollTargetId={focusTarget}
          headerContent={<div className="pw-shared-context"><span>Shared channel thread</span><span>4 people + 1 agent</span></div>}
        />
      )}
      {modal && <DemoDialog key={modal.kind} modal={modal} onClose={() => setModal(null)}
        onSelectSource={(sourceId) => setModal({ kind: 'source', sourceId })}
        onApprove={(actorId) => { dispatch({ type: 'approve', actorId }); setModal(null) }}
        onSaveMeeting={(time) => { dispatch({ type: 'edit-meeting', time }); setModal(null) }} />}
    </div>
  )
}
