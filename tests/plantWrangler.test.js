import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  plantChannel, plantParticipants, plantSources, plantPosts, plantQuestions,
  plantAnswerRows, plantScheduleOptions, initialPlantDemo, plantDemoReducer, getPlantReplies,
} from '../src/data/plantWrangler.js'

const transition = (state, type, extra = {}) => plantDemoReducer(state, { type, ...extra })
const advance = (state, ...actions) => actions.reduce((current, type) => transition(current, type), state)
const answered = () => advance(initialPlantDemo, 'ask', 'review-procedure', 'start-answer', 'answer')
const exploring = () => transition(answered(), 'explore')
const approvalState = () => transition(transition(exploring(), 'select-option', { optionId: 'adjustment' }), 'request-approval')
const approvedState = () => transition(approvalState(), 'approve', { actorId: 102 })
const findMessage = (state, id) => getPlantReplies(state).find((message) => message.id === id)

test('opening is a populated shared channel with four people and a distinct agent', () => {
  assert.equal(plantChannel.name, 'Plant Operations | Launch Readiness')
  assert.equal(plantChannel.isChannel, true)
  assert.equal(plantParticipants.filter((person) => !person.isAgent).length, 4)
  assert.equal(plantParticipants.filter((person) => person.isAgent).length, 1)
  assert.equal(plantParticipants.find((person) => person.isAgent).name, 'Plant Wrangler')
  assert.equal(plantPosts.length, 2)
  assert.equal(getPlantReplies(initialPlantDemo).length, 2)
})

test('Maya asks the revised filming question with a shared channel mention', () => {
  assert.equal(plantQuestions.plant, '@Plant Wrangler, can Line 3 take this rush order before launch?')
  const question = findMessage(transition(initialPlantDemo, 'ask'), 'pw-question')
  assert.equal(question.senderId, 101)
  assert.deepEqual(question.text, [
    { type: 'mention', name: '@Plant Wrangler' },
    ', can Line 3 take this rush order before launch?',
  ])
})

test('progress updates describe work activity before the answer arrives', () => {
  const checking = transition(initialPlantDemo, 'ask')
  assert.equal(findMessage(checking, 'pw-progress').text, 'Checking capacity')
  assert.equal(findMessage(checking, 'pw-plant-answer'), undefined)
  const procedure = transition(checking, 'review-procedure')
  assert.equal(findMessage(procedure, 'pw-progress').text, 'Reviewing changeover procedure')
  assert.equal(findMessage(procedure, 'pw-plant-answer'), undefined)
  const streaming = transition(procedure, 'start-answer')
  assert.equal(streaming.stage, 'streaming')
  assert.equal(streaming.answerRows, 0)
  assert.ok(findMessage(streaming, 'pw-plant-answer'))
})

test('prepared answer streams exactly three rows and stops without duplicating its message', () => {
  let state = advance(initialPlantDemo, 'ask', 'review-procedure', 'start-answer')
  for (let row = 1; row <= 3; row += 1) {
    state = transition(state, 'stream-row')
    assert.equal(state.answerRows, row)
    assert.equal(state.stage, row === 3 ? 'plant' : 'streaming')
  }
  assert.equal(transition(state, 'stream-row'), state)
  assert.equal(getPlantReplies(state).filter((message) => message.id === 'pw-plant-answer').length, 1)
  assert.equal(transition(state, 'answer'), state)
})

test('answer has capacity, constraints and three grounded source references', () => {
  assert.deepEqual(plantAnswerRows.map((row) => row.capacity), ['82% available', '+6 pp overtime', '+3 pp changeover'])
  assert.match(plantAnswerRows[0].constraint, /91% required.*9 pp gap/)
  assert.match(plantAnswerRows[1].constraint, /Saturday 06:00–14:00.*Elena/)
  assert.match(plantAnswerRows[2].constraint, /Friday 18:00.*CP-17/)
  assert.deepEqual(plantAnswerRows.map((row) => row.sourceId), plantSources.map((source) => source.id))
  assert.match(findMessage(answered(), 'pw-plant-answer').text, /if Elena approves/)
})

test('three named local source fixtures include owners, versions and relevant facts', () => {
  assert.deepEqual(plantSources.map((source) => source.title), [
    'Caldova Capacity Plan', 'Line 3 Production Schedule', 'Changeover Procedure CP-17',
  ])
  for (const source of plantSources) {
    assert.ok(source.owner && source.version && source.updated && source.summary)
    assert.ok(source.facts.length >= 4)
    assert.equal('url' in source, false)
  }
})

test('the widget has exactly two prepared options and selection alone commits nothing', () => {
  assert.deepEqual(plantScheduleOptions.map((option) => option.id), ['current', 'adjustment'])
  assert.deepEqual(plantScheduleOptions.map((option) => option.capacity), ['82%', '91%'])
  assert.deepEqual(plantScheduleOptions.map((option) => option.cost), ['$0', '$18,400'])
  const state = transition(exploring(), 'select-option', { optionId: 'adjustment' })
  assert.equal(state.stage, 'exploring')
  assert.equal(state.preparedOption, null)
  assert.equal(state.approvedBy, null)
  assert.equal(findMessage(state, 'pw-approval'), undefined)
  assert.equal(transition(state, 'select-option', { optionId: 'unprepared' }), state)
})

test('prepare for approval rejects the insufficient baseline and snapshots the selected adjustment', () => {
  const blocked = transition(exploring(), 'request-approval')
  assert.equal(blocked.stage, 'exploring')
  assert.match(blocked.optionError, /9 pp gap/)
  const state = approvalState()
  assert.equal(state.stage, 'approval')
  assert.equal(state.preparedOption, 'adjustment')
  assert.equal(transition(state, 'select-option', { optionId: 'current' }), state)
  const card = findMessage(state, 'pw-approval').cards[0]
  assert.match(card.sections[0].text, /Proposed adjustment.*91%/)
  assert.deepEqual(card.actions.map((action) => action.label), ['Approve', 'Request changes', 'View evidence'])
  assert.ok(card.sections[1].facts.some((fact) => fact.label === 'Approver' && fact.value === 'Elena Torres'))
})

test('the local app rule denies every actor except the named approver', () => {
  for (const actorId of [undefined, 101, 103, 104, 105, '102']) {
    const denied = transition(approvalState(), 'approve', { actorId })
    assert.equal(denied.stage, 'approval')
    assert.equal(denied.approvedBy, null)
    assert.match(denied.decisionError, /Only Elena Torres/)
    assert.equal(findMessage(denied, 'pw-human-approval'), undefined)
  }
  const retry = transition(approvalState(), 'approve', { actorId: 101 })
  assert.equal(transition(retry, 'approve', { actorId: 102 }).decisionError, '')
})

test('consequential actions cannot skip work status, exploration or human approval', () => {
  for (const type of ['review-procedure', 'start-answer', 'stream-row', 'answer', 'explore', 'request-approval', 'approve', 'confirm', 'schedule', 'show-meeting', 'show-evidence']) {
    assert.equal(transition(initialPlantDemo, type), initialPlantDemo)
  }
  const plant = answered()
  assert.equal(transition(plant, 'request-approval'), plant)
  assert.equal(findMessage(plant, 'pw-approval'), undefined)
  assert.equal(transition(approvalState(), 'confirm').stage, 'approval')
})

test('request changes requires revised resubmission and keeps the audit history after approval', () => {
  const changes = transition(approvalState(), 'request-changes')
  assert.equal(transition(changes, 'approve', { actorId: 102 }), changes)
  const revised = transition(changes, 'resubmit')
  assert.equal(revised.changesRequested, false)
  assert.equal(revised.staffingCheckpointAdded, true)
  assert.match(findMessage(revised, 'pw-approval').cards[0].sections.find((section) => section.heading === 'Revised staffing checkpoint').text, /overtime roster/)
  const approved = transition(revised, 'approve', { actorId: 102 })
  assert.equal(findMessage(approved, 'pw-request-changes').senderId, 102)
  assert.equal(findMessage(approved, 'pw-revised-request').senderId, 105)
})

test('approval updates the same card with actor and timestamp without changing production or booking anything', () => {
  const state = approvedState()
  assert.equal(state.approvedBy, 102)
  const card = findMessage(state, 'pw-approval').cards[0]
  assert.equal(card.id, 'overtime')
  assert.equal(card.badge.text, 'Approved')
  assert.equal(card.actions.length, 0)
  assert.match(card.footer, /Approved by Elena Torres.*9:47 AM PT/)
  assert.equal(findMessage(state, 'pw-human-approval').senderId, 102)
  assert.match(findMessage(state, 'pw-approval-confirmation').text, /confidence is now high/)
  assert.match(findMessage(state, 'pw-approval-confirmation').text, /production schedule has not been changed/)
  assert.equal(findMessage(state, 'pw-meeting'), undefined)
  assert.equal(state.meetingScheduled, false)
  assert.equal(transition(state, 'approve', { actorId: 102 }), state)
})

test('confirmation stays in the same thread and preserves the agreed plan and no-production-action boundary', () => {
  const state = transition(approvedState(), 'confirm')
  assert.equal(state.stage, 'confirmed')
  const message = findMessage(state, 'pw-completed')
  assert.equal(message.plantDetail, 'completed')
  assert.match(message.text, /Saturday overtime, 06:00–14:00.*Friday 18:00/)
  assert.match(message.text, /91%.*\$18,400/)
  assert.match(message.text, /production schedule has not been changed/)
  assert.equal(transition(state, 'show-evidence').evidenceVisible, true)
})

test('network comparison remains optional and does not interrupt the revised timeline', () => {
  const state = transition(answered(), 'network')
  assert.equal(state.stage, 'plant')
  assert.equal(findMessage(state, 'pw-network-question').senderId, 103)
  assert.match(findMessage(state, 'pw-network-answer').text, /700-unit shortfall, or 7%/)
  assert.match(findMessage(state, 'pw-network-answer').text, /340 units to resolve/)
  assert.equal(findMessage(transition(approvedState(), 'confirm'), 'pw-network-answer'), undefined)
})

test('optional meeting retains its agenda, two slots and idempotent local scheduling', () => {
  const confirmed = transition(approvedState(), 'confirm')
  const meeting = transition(confirmed, 'show-meeting')
  const card = findMessage(meeting, 'pw-meeting').cards[0]
  assert.equal(card.sections[1].bullets.length, 4)
  assert.equal(transition(meeting, 'edit-meeting', { time: '08:00' }), meeting)
  const edited = transition(meeting, 'edit-meeting', { time: '10:00' })
  const scheduled = transition(edited, 'schedule')
  assert.equal(scheduled.stage, 'confirmed')
  assert.equal(scheduled.meetingTime, '10:00')
  assert.equal(findMessage(scheduled, 'pw-meeting').cards[0].footer, 'Meeting scheduled. Agenda included in the invitation.')
  assert.equal(transition(scheduled, 'schedule'), scheduled)
  assert.equal(transition(scheduled, 'edit-meeting', { time: '09:00' }), scheduled)
})

test('reset clears progress, selected option, approval, supplemental actions and evidence', () => {
  const completed = advance(approvedState(), 'confirm', 'network', 'show-meeting', 'schedule', 'show-evidence')
  const reset = transition(completed, 'reset')
  assert.deepEqual(reset, { ...initialPlantDemo, resetVersion: 1 })
  assert.equal(getPlantReplies(reset).length, 2)
  assert.equal(transition(reset, 'reset').resetVersion, 2)
})

test('the complete walkthrough replays with identical data and fixed timestamps', () => {
  const replay = () => getPlantReplies(transition(approvedState(), 'confirm'))
  assert.deepEqual(replay(), replay())
  assert.throws(() => transition(initialPlantDemo, 'unknown'), /Unknown Plant Wrangler demo action/)
})
