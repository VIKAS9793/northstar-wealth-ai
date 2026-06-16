import { describe, it, expect } from 'vitest';
import { getNextState } from '../../src/components/avatar/AvatarStateManager';

describe('AvatarStateManager', () => {
  it('should transition from IDLE to LISTENING when user types', () => {
    expect(getNextState('IDLE', 'USER_TYPING')).toBe('LISTENING');
  });

  it('should transition from LISTENING to THINKING when message is sent', () => {
    expect(getNextState('LISTENING', 'MESSAGE_SENT')).toBe('THINKING');
  });

  it('should queue rapidly sent messages (SPEAKING to THINKING)', () => {
    // This was the deadlock fix
    expect(getNextState('SPEAKING', 'MESSAGE_SENT')).toBe('THINKING');
  });

  it('should recover from network failures (THINKING to IDLE)', () => {
    // This was the deadlock fix
    expect(getNextState('THINKING', 'RESPONSE_COMPLETE')).toBe('IDLE');
  });

  it('should transition to COACHING on resilience flag', () => {
    expect(getNextState('THINKING', 'RESILIENCE_FLAG')).toBe('COACHING');
    expect(getNextState('SPEAKING', 'RESILIENCE_FLAG')).toBe('COACHING');
  });
});
