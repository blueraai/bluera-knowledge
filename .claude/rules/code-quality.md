# Code Quality Rules

## Fail Early and Fast

Our code is expected to *work* as-designed:
- Use `throw` when state is unexpected or for any error condition
- Use 100% strict typing; no `any` no `as`, unless completely unavoidable and considered best practice

## Never

- Write "fallback code" or "graceful degradation" code or implement "defaults" *unless* it's part of the specification
- Leave commented code, nor reference outdated/deprecated implementations
