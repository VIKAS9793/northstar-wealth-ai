export type AvatarState = 
  | 'IDLE'
  | 'LISTENING' 
  | 'THINKING'
  | 'SPEAKING'
  | 'COACHING'

export type ConversationEvent =
  | 'USER_TYPING'
  | 'MESSAGE_SENT'
  | 'RESPONSE_READY'
  | 'RESPONSE_COMPLETE'
  | 'RESILIENCE_FLAG'
  | 'COMPLIANCE_TRIGGER'
