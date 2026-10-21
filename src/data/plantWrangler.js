const base = import.meta.env?.BASE_URL ?? '/'

export const plantChannel = {
  id: 100,
  name: 'Plant Operations | Launch Readiness',
  initials: 'PO',
  color: '#5B5FC7',
  isChannel: true,
  memberCount: 5,
}

export const plantParticipants = [
  { id: 101, name: 'Maya Chen', initials: 'MC', color: '#6264A7', status: 'available', role: 'Operations manager' },
  { id: 102, name: 'Elena Torres', initials: 'ET', color: '#005B70', status: 'available', role: 'Plant manager' },
  { id: 103, name: 'David Okafor', initials: 'DO', color: '#8764B8', status: 'available', role: 'VP of manufacturing' },
  { id: 104, name: 'Nora Singh', initials: 'NS', color: '#CA5010', status: 'available', role: 'Maintenance lead' },
  {
    id: 105, name: 'Plant Wrangler', initials: null, color: '#E8EBFA',
    isAgent: true, avatar: `${base}avatars/plant-wrangler.svg`,
    role: 'Third-party collaborative agent',
    description: 'Manufacturing recommendations, grounded in shared evidence. People approve the actions.',
  },
]

export const plantSources = [
  {
    id: 'capacity', title: 'Caldova Capacity Plan', kind: 'Planning workbook',
    owner: 'Maya Chen', version: 'Revision 12', updated: 'Mon, Oct 19, 08:30 PT',
    location: 'Caldova / Launch operations / Capacity',
    summary: 'Launch week demand is 10,000 units. Available output is 9,300 units: a 700-unit shortfall, or 7% of demand.',
    facts: [
      ['Vancouver · Line 3', '3,280 available / 3,640 required units'],
      ['Monterrey', '4,550 available / 4,800 required units'],
      ['Brno', '1,470 available / 1,560 required units'],
      ['Saturday overtime', '+240 units = 6 percentage points of Line 3 rated capacity'],
    ],
  },
  {
    id: 'schedule', title: 'Line 3 Production Schedule', kind: 'Production schedule',
    owner: 'Elena Torres', version: 'Launch week · Oct 19–25', updated: 'Mon, Oct 19, 08:45 PT',
    location: 'Caldova / Vancouver / Line 3',
    summary: 'Line 3 has 82% available capacity against a 91% launch allocation. The 9-percentage-point gap equals 360 units against a 4,000-unit rated weekly baseline.',
    facts: [
      ['Overtime proposal', 'Saturday, Oct 24 · 06:00–14:00 PT'],
      ['Estimated incremental cost', '$18,400'],
      ['Decision owner', 'Elena Torres · plant manager'],
      ['Staffing', 'Roster confirmation at change control'],
    ],
  },
  {
    id: 'procedure', title: 'Changeover Procedure CP-17', kind: 'Controlled procedure',
    owner: 'Nora Singh', version: 'CP-17 · Revision 4', updated: 'Fri, Oct 16, 15:20 PT',
    location: 'Caldova / Operating procedures / Changeovers',
    summary: 'An earlier Friday-evening changeover can recover 120 units, or 3 percentage points of Line 3 rated capacity, within the approved operating window.',
    facts: [
      ['Proposed start', 'Friday, Oct 23 · 18:00 PT'],
      ['Maintenance coverage', 'Nora Singh to confirm at change control'],
      ['Operating constraints', 'Existing safety checks and release criteria remain unchanged'],
      ['Scope', 'Planning evidence only; no equipment commands'],
    ],
  },
]

export const plantPosts = [
  {
    id: 'pw-handover', senderId: 104, time: 'Fri 3:20 PM',
    subject: 'Changeover window confirmed',
    text: 'CP-17 is current. Friday evening is within the approved operating window. I will bring the maintenance coverage plan to change control.',
    reactions: [{ emoji: '👍', count: 2 }], replies: [],
  },
  {
    id: 'pw-launch', senderId: 101, time: 'Mon 9:30 AM',
    subject: 'Launch capacity · rush order',
    text: 'We are 7% short of the launch requirement across Vancouver, Monterrey and Brno. The rush order is in the latest capacity plan. Let’s agree on recovery options here before we change the schedule.',
    reactions: [{ emoji: '👍', count: 3 }],
    replies: [
      { id: 'pw-elena-context', senderId: 102, time: '9:32 AM', text: 'Line 3 is the immediate constraint in Vancouver. I can review an overtime request today, with the cost and operating window attached.' },
      { id: 'pw-nora-context', senderId: 104, time: '9:34 AM', text: 'Earlier changeover looks feasible under CP-17. Maintenance coverage still needs a named check at the meeting.' },
    ],
  },
]

export const plantQuestions = {
  plant: '@Plant Wrangler, can Line 3 take this rush order before launch?',
  network: '@Plant Wrangler What does this mean across the manufacturing network?',
}

export const plantAnswerRows = [
  { id: 'current', capacity: '82% available', constraint: '91% required · 9 pp gap', sourceId: 'capacity' },
  { id: 'overtime', capacity: '+6 pp overtime', constraint: 'Saturday 06:00–14:00 · Elena’s approval', sourceId: 'schedule' },
  { id: 'changeover', capacity: '+3 pp changeover', constraint: 'Friday 18:00 · CP-17 checks unchanged', sourceId: 'procedure' },
]

export const plantScheduleOptions = [
  { id: 'current', title: 'Current schedule', capacity: '82%', gap: '9 pp remaining', cost: '$0', shift: 'No additional shift', changeover: 'Existing changeover', description: 'Does not cover the rush order.' },
  { id: 'adjustment', title: 'Proposed adjustment', capacity: '91%', gap: 'Gap covered in plan', cost: '$18,400', shift: 'Saturday 06:00–14:00', changeover: 'Friday 18:00 · CP-17', description: '+6 pp overtime and +3 pp earlier changeover.' },
]

export const plantAgenda = [
  'Confirm overtime staffing',
  'Review accelerated changeover',
  'Validate maintenance coverage',
  'Confirm production and launch risks',
]

export const plantSceneLabels = {
  ready: '0:00–0:25 · Ask',
  checking: '0:25–1:00 · Checking capacity',
  procedure: '0:25–1:00 · Reviewing changeover procedure',
  streaming: '0:25–1:00 · Answer arriving',
  plant: '0:25–1:00 · Check and answer',
  exploring: '1:00–1:45 · Explore an option',
  approval: '1:45–2:30 · Decide',
  approved: '1:45–2:30 · Decision recorded',
  confirmed: '2:30–3:00 · Confirm',
}

export const initialPlantDemo = {
  stage: 'ready',
  answerRows: 0,
  selectedOption: 'current',
  preparedOption: null,
  approvedBy: null,
  decisionError: '',
  optionError: '',
  changesRequested: false,
  staffingCheckpointAdded: false,
  networkVisible: false,
  meetingVisible: false,
  meetingScheduled: false,
  evidenceVisible: false,
  meetingTime: '09:00',
  resetVersion: 0,
}

// Every consequential transition is guarded, including clicks during the fixed loading interval.
export function plantDemoReducer(state, action) {
  switch (action.type) {
    case 'reset':
      return { ...initialPlantDemo, resetVersion: state.resetVersion + 1 }
    case 'ask':
      return state.stage === 'ready' ? { ...state, stage: 'checking' } : state
    case 'review-procedure':
      return state.stage === 'checking' ? { ...state, stage: 'procedure' } : state
    case 'start-answer':
      return state.stage === 'procedure' ? { ...state, stage: 'streaming' } : state
    case 'stream-row': {
      if (state.stage !== 'streaming') return state
      const answerRows = state.answerRows + 1
      return { ...state, answerRows, stage: answerRows === plantAnswerRows.length ? 'plant' : 'streaming' }
    }
    case 'answer':
      return state.stage === 'streaming' ? { ...state, stage: 'plant', answerRows: plantAnswerRows.length } : state
    case 'explore':
      return state.stage === 'plant' ? { ...state, stage: 'exploring' } : state
    case 'select-option':
      return state.stage === 'exploring' && plantScheduleOptions.some((option) => option.id === action.optionId)
        ? { ...state, selectedOption: action.optionId, optionError: '' } : state
    case 'network':
      return ['plant', 'exploring', 'approval', 'approved', 'confirmed'].includes(state.stage)
        ? { ...state, networkVisible: true } : state
    case 'request-approval':
      if (state.stage !== 'exploring') return state
      return state.selectedOption === 'adjustment'
        ? { ...state, stage: 'approval', preparedOption: state.selectedOption, optionError: '' }
        : { ...state, optionError: 'The current schedule leaves a 9 pp gap. Select the proposed adjustment to prepare approval.' }
    case 'request-changes':
      return state.stage === 'approval' ? { ...state, changesRequested: true } : state
    case 'resubmit':
      return state.stage === 'approval' && state.changesRequested
        ? { ...state, changesRequested: false, staffingCheckpointAdded: true } : state
    case 'approve':
      if (state.stage !== 'approval' || state.changesRequested || state.preparedOption !== 'adjustment') return state
      return action.actorId === 102
        ? { ...state, stage: 'approved', approvedBy: action.actorId, decisionError: '' }
        : { ...state, decisionError: 'Only Elena Torres, the named approver, can approve this request in the local simulation.' }
    case 'confirm':
      return state.stage === 'approved' ? { ...state, stage: 'confirmed' } : state
    case 'show-meeting':
      return ['approved', 'confirmed'].includes(state.stage) ? { ...state, meetingVisible: true } : state
    case 'edit-meeting':
      return state.meetingVisible && !state.meetingScheduled && ['09:00', '10:00'].includes(action.time)
        ? { ...state, meetingTime: action.time } : state
    case 'schedule':
      return state.meetingVisible && !state.meetingScheduled ? { ...state, meetingScheduled: true } : state
    case 'show-evidence':
      return state.stage === 'confirmed' ? { ...state, evidenceVisible: true } : state
    default:
      throw new Error(`Unknown Plant Wrangler demo action: ${action.type}`)
  }
}

function mention(text) {
  return [{ type: 'mention', name: '@Plant Wrangler' }, text.slice('@Plant Wrangler'.length)]
}

function agentMessage(id, time, text, extra = {}) {
  return { id, senderId: 105, time, text, ...extra }
}

export function getPlantReplies(demo) {
  const stages = Object.keys(plantSceneLabels)
  const atLeast = (stage) => stages.indexOf(demo.stage) >= stages.indexOf(stage)
  const approved = atLeast('approved')
  const scheduled = demo.meetingScheduled
  const replies = [...plantPosts[1].replies]
  if (atLeast('checking')) {
    replies.push({ id: 'pw-question', senderId: 101, time: '9:40 AM', text: mention(plantQuestions.plant) })
    replies.push(agentMessage('pw-progress', '9:40 AM',
      demo.stage === 'checking' ? 'Checking capacity'
        : demo.stage === 'procedure' ? 'Reviewing changeover procedure'
          : demo.stage === 'streaming' ? 'Preparing the capacity answer'
            : 'Capacity and changeover checks complete.', { plantDetail: 'progress' }))
  }
  if (atLeast('streaming')) {
    replies.push(agentMessage('pw-plant-answer', '9:41 AM',
      'Line 3 can cover the rush order if Elena approves Saturday overtime and the changeover begins Friday evening.', {
        plantDetail: 'plant',
      }))
  }
  if (atLeast('exploring')) {
    replies.push(agentMessage('pw-options', '9:43 AM',
      'Maya, compare the two prepared schedules. Selecting an option does not approve it or change the production schedule.', { plantDetail: 'options' }))
  }
  if (atLeast('approval')) {
    replies.push(agentMessage('pw-approval', '9:45 AM', 'Elena, this decision is yours. No overtime is committed by this recommendation.', {
      plantDetail: 'approval',
      cards: [{
        id: 'overtime', accentColor: approved ? '#107C10' : '#5B5FC7',
        title: 'Overtime approval required',
        subtitle: 'Line 3 · Vancouver',
        badge: { text: approved ? 'Approved' : demo.changesRequested ? 'Changes requested' : 'Awaiting Elena', tone: approved ? 'green' : 'amber' },
        sections: [
          { heading: 'Selected option', text: 'Proposed adjustment · 91% planned capacity · +6 pp overtime and +3 pp earlier changeover' },
          { facts: [
            { label: 'Shift', value: 'Saturday 06:00–14:00' },
            { label: 'Estimated additional capacity', value: '6 percentage points' },
            { label: 'Estimated incremental cost', value: '$18,400' },
            { label: 'Approver', value: 'Elena Torres' },
          ] },
          { heading: 'Business reason', text: 'Protect the launch date while keeping the changeover within the approved operating window' },
          ...(demo.staffingCheckpointAdded ? [{ heading: 'Revised staffing checkpoint', text: 'Confirm the overtime roster at Tuesday change control before the approved shift runs. Shift hours and estimated cost are unchanged.' }] : []),
        ],
        footer: approved ? 'Approved by Elena Torres · Mon, Oct 19, 9:47 AM PT' : 'A named human decision is required · local prototype',
        actions: approved ? [] : demo.changesRequested
          ? [{ id: 'resubmit', label: 'Return revised request', primary: true }, { id: 'evidence', label: 'View evidence' }]
          : [
            { id: 'approve', label: 'Approve', primary: true },
            { id: 'changes', label: 'Request changes' },
            { id: 'evidence', label: 'View evidence' },
          ],
      }],
    }))
    if (demo.changesRequested || demo.staffingCheckpointAdded) {
      replies.push({ id: 'pw-request-changes', senderId: 102, time: '9:46 AM',
        text: 'Please make the staffing check explicit before I approve. Keep the shift and cost unchanged.' })
      if (demo.staffingCheckpointAdded && !demo.changesRequested) {
        replies.push(agentMessage('pw-revised-request', '9:46 AM', 'Request revised: the overtime roster must be confirmed at Tuesday change control before the shift runs. Hours and estimated cost are unchanged. Elena, please review the updated card.'))
      }
    }
  }
  if (approved) {
    replies.push(
      { id: 'pw-human-approval', senderId: 102, time: '9:47 AM',
        text: 'Approved for Saturday, 06:00–14:00, at the estimated $18,400. Please confirm staffing and maintenance coverage at change control.',
        reactions: [{ emoji: '👍', count: 2 }] },
      agentMessage('pw-approval-confirmation', '9:47 AM',
        'Elena’s approval is recorded. Recommendation confidence is now high; staffing and maintenance checks remain with the team. The production schedule has not been changed.', { plantDetail: 'decision' }),
    )
  }
  if (atLeast('confirmed')) {
    replies.push(agentMessage('pw-completed', '9:49 AM',
      'Agreed plan: Saturday overtime, 06:00–14:00 (+6 pp), and a Friday 18:00 changeover under CP-17 (+3 pp). Planned Line 3 capacity is 91%, covering the rush order. Elena approved the $18,400 overtime estimate. Maya owns staffing follow-up; Nora confirms maintenance coverage. This records the team’s decision only—the production schedule has not been changed.', { plantDetail: 'completed' }))
  }
  if (demo.networkVisible) {
    replies.push(
      { id: 'pw-network-question', senderId: 103, time: '9:50 AM', text: mention(plantQuestions.network) },
      agentMessage('pw-network-answer', '9:50 AM',
        'Across all three plants, available output is 9,300 against 10,000 required units: a 700-unit shortfall, or 7% of launch demand. Line 3 can recover 360 units. That still leaves 340 units to resolve in Monterrey and Brno.', { plantDetail: 'network' }),
    )
  }
  if (demo.meetingVisible) {
    replies.push(agentMessage('pw-meeting', '9:51 AM', 'Maya, here is the optional change-control checkpoint for the team.', {
        cards: [{
          id: 'meeting', accentColor: scheduled ? '#107C10' : '#5B5FC7',
          title: 'Capacity change-control meeting',
          subtitle: 'Line 3 launch capacity change control',
          badge: { text: scheduled ? 'Scheduled' : 'Proposed', tone: scheduled ? 'green' : 'purple' },
          sections: [
            { facts: [
              { label: 'Attendees', value: 'Maya Chen, Elena Torres, Nora Singh and David Okafor' },
              { label: 'Proposed time', value: `Tuesday, ${demo.meetingTime}–${demo.meetingTime === '09:00' ? '09:30' : '10:30'} PT` },
              { label: 'Location', value: 'Microsoft Teams' },
            ] },
            { heading: 'Agenda', bullets: plantAgenda.map((item, i) => `${i + 1}. ${item}`) },
          ],
          footer: scheduled ? 'Meeting scheduled. Agenda included in the invitation.' : 'Tuesday, Oct 20 · Scheduling as Maya Chen · simulated invitation',
          actions: scheduled ? [] : [
            { id: 'schedule', label: 'Schedule meeting', primary: true },
            { id: 'edit', label: 'Edit details' },
          ],
        }],
      }))
  }
  return replies
}
