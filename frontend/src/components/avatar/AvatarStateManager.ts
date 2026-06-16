import { AvatarState, ConversationEvent } from './avatarStates';

export const transitions: Record<AvatarState, Partial<Record<ConversationEvent, AvatarState>>> = {
  IDLE:      { USER_TYPING: 'LISTENING' },
  LISTENING: { MESSAGE_SENT: 'THINKING' },
  THINKING:  { RESPONSE_READY: 'SPEAKING', RESILIENCE_FLAG: 'COACHING', RESPONSE_COMPLETE: 'IDLE' },
  SPEAKING:  { 
    RESPONSE_COMPLETE: 'IDLE',
    RESILIENCE_FLAG: 'COACHING',
    MESSAGE_SENT: 'THINKING'
  },
  COACHING:  { RESPONSE_COMPLETE: 'IDLE' }
}

export function getNextState(currentState: AvatarState, event: ConversationEvent): AvatarState {
  const next = transitions[currentState]?.[event];
  return next || currentState;
}
