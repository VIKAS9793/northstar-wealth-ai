# Avatar Feature Domain

## Purpose
Manages the visual representation, state transitions, and UI integration of the Dhan Wealth Companion Avatar. Handles the strict synchronization between the underlying chat API state and the Framer Motion-driven Lottie animations.

## Inputs
- `ConversationEvent`: Triggers state changes (e.g., `START_THINKING`, `RESILIENCE_FLAG`).

## Outputs
- Rendered React Components (`DhanAvatar.tsx`).
- `AvatarState`: The active visual state (`IDLE`, `THINKING`, `SPEAKING`, `COACHING`, `LISTENING`).

## Dependencies
- `framer-motion`: For strict transition cross-fading.
- `@lottiefiles/react-lottie-player`: For rendering JSON animation models.
