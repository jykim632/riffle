# E2E Testing Guide

## Prerequisites

### 1. Database Setup

Run the initialization script to create the first week and invite code:

```bash
# In Supabase Dashboard > SQL Editor
# Run: supabase/dev-init.sql
```

### 2. Create First Admin Account

1. Start the dev server: `pnpm dev`
2. Go to `http://localhost:3000/signup`
3. Use invite code: `ADMIN001`
4. Fill in your details and signup

### 3. Promote to Admin

In Supabase Dashboard > SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 4. Create Test User

1. Login to the app as admin
2. Create a new invite code (or use admin UI once available)
3. Create a test user with credentials:
   - Email: `test-user@test.com`
   - Password: `test1234`
   - Nickname: `TestUser`

Alternatively, run this SQL:

```sql
-- First create invite code via UI or:
INSERT INTO public.invite_codes (code, created_by, is_used)
VALUES (
  'TEST1234',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1),
  false
);

-- Then signup via UI with the above credentials
-- Or directly in SQL (not recommended, use UI to test signup flow):
-- This is complex as it requires Supabase Auth, better to use the UI
```

### 5. Verify Supabase Auth Settings

In Supabase Dashboard > Authentication > Settings:

- **Email Confirmation**: Disable for local testing
  - Go to Authentication > Providers > Email
  - Turn OFF "Confirm email"
- This allows instant login without email verification

## Running Tests

### All tests
```bash
pnpm test:e2e
```

### UI Mode (interactive)
```bash
pnpm test:e2e:ui
```

### Headed mode (see browser)
```bash
pnpm test:e2e:headed
```

### View last report
```bash
pnpm test:e2e:report
```

### Run specific test file
```bash
pnpm exec playwright test tests/e2e/auth.spec.ts
```

### Run specific test
```bash
pnpm exec playwright test -g "should login successfully"
```

## Test Data

Test fixtures are in `tests/fixtures/test-data.ts`.

**Important:**
- Each signup test generates unique email: `test-${Date.now()}@test.com`
- Valid invite code: `TEST1234` (must exist in DB)
- Existing user credentials in fixture must match a real user

## Troubleshooting

### "Invalid invite code" error
- Make sure `TEST1234` invite code exists and is not used
- Check: `SELECT * FROM public.invite_codes WHERE code = 'TEST1234'`

### "Invalid credentials" error
- Make sure test user exists with correct email/password
- Check: `SELECT * FROM auth.users WHERE email = 'test-user@test.com'`

### Email confirmation required
- Disable email confirmation in Supabase Auth settings

### Tests timeout
- Make sure dev server is running on port 3000
- Check network tab for any failing API calls

## CI/CD

For CI environments, you'll need to:
1. Use Supabase test project or local instance
2. Seed test data automatically
3. Set environment variables for test credentials
4. Use headless mode (default in CI)

## Next Steps

- [ ] Add dashboard E2E tests
- [ ] Add summaries CRUD tests
- [ ] Add visual regression tests
- [ ] Set up CI pipeline
