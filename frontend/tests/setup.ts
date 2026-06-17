import '@testing-library/jest-dom';
import { vi } from 'vitest';

process.env.NVIDIA_API_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-key';

vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = { completions: { create: vi.fn() } };
    }
  };
});
