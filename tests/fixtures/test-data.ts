/**
 * Test data fixtures for E2E tests
 */

/**
 * Generate unique email for each test run to avoid conflicts
 */
export function generateTestEmail(prefix = 'test'): string {
  return `${prefix}-${Date.now()}@test.com`
}

/**
 * Valid test credentials for existing user
 * NOTE: This user must be created manually in Supabase before running tests
 */
export const EXISTING_USER = {
  email: 'test-user@test.com',
  password: 'test1234',
  nickname: 'TestUser',
}

/**
 * Valid invite code for testing signup
 * NOTE: This code must exist in the database before running tests
 * You can create it via dev-init.sql or through the admin UI
 */
export const VALID_INVITE_CODE = 'TEST1234'

/**
 * Invalid invite code for negative testing
 */
export const INVALID_INVITE_CODE = 'INVALID1'

/**
 * Test signup data
 */
export function generateSignupData() {
  return {
    inviteCode: VALID_INVITE_CODE,
    nickname: `TestUser${Date.now()}`,
    email: generateTestEmail(),
    password: 'test1234',
  }
}
