

## Plan: Add Inline Field Validation to Auth Page

Add real-time validation feedback on the email and password fields in the Auth page using simple state-based validation (no additional libraries needed for this simple form).

### Validations

**Email field:**
- Show error if not a valid email format on blur
- "Please enter a valid email address"

**Password field:**
- Show error if less than 6 characters on blur
- "Password must be at least 6 characters"
- On signup only: show password strength hints (e.g., character count indicator)

### Implementation

**Single file change: `src/pages/Auth.tsx`**
- Add `emailError` and `passwordError` state variables
- Add `onBlur` handlers to validate each field and set error messages
- Clear errors on change (`onChange`)
- Render error text below each input in red (`text-destructive text-sm`)
- Disable submit button when validation errors are present
- Keep the existing `toast.error` for server-side errors unchanged

No new dependencies or database changes needed.

