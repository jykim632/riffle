import { test, expect } from '@playwright/test'
import {
  generateSignupData,
  EXISTING_USER,
  INVALID_INVITE_CODE,
} from '../fixtures/test-data'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure logged out state before each test
    await page.goto('/login')
  })

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login')

    // Check page elements
    await expect(page.locator('h1')).toContainText('로그인')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Check signup link
    const signupLink = page.locator('a[href="/signup"]')
    await expect(signupLink).toBeVisible()
  })

  test('should display signup page correctly', async ({ page }) => {
    await page.goto('/signup')

    // Check page elements
    await expect(page.locator('h1')).toContainText('회원가입')
    await expect(page.locator('input[name="inviteCode"]')).toBeVisible()
    await expect(page.locator('input[name="nickname"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Check login link
    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()
  })

  test('should fail signup with invalid invite code', async ({ page }) => {
    await page.goto('/signup')

    const signupData = generateSignupData()

    // Fill form with invalid invite code
    await page.fill('input[name="inviteCode"]', INVALID_INVITE_CODE)
    await page.fill('input[name="nickname"]', signupData.nickname)
    await page.fill('input[name="email"]', signupData.email)
    await page.fill('input[name="password"]', signupData.password)

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for error message
    await expect(
      page.locator('text=/유효하지 않은|잘못된|존재하지 않는/i')
    ).toBeVisible({ timeout: 5000 })

    // Should stay on signup page
    await expect(page).toHaveURL(/\/signup/)
  })

  test('should signup successfully with valid invite code', async ({
    page,
  }) => {
    await page.goto('/signup')

    const signupData = generateSignupData()

    // Fill form with valid data
    await page.fill('input[name="inviteCode"]', signupData.inviteCode)
    await page.fill('input[name="nickname"]', signupData.nickname)
    await page.fill('input[name="email"]', signupData.email)
    await page.fill('input[name="password"]', signupData.password)

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Should show user nickname in the page (assuming it's displayed)
    // This might need adjustment based on actual dashboard implementation
    await expect(page.locator('body')).toContainText(signupData.nickname, {
      timeout: 5000,
    })
  })

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@test.com')
    await page.fill('input[name="password"]', 'wrongpassword')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for error message
    await expect(
      page.locator('text=/잘못된|유효하지 않은|이메일|비밀번호/i')
    ).toBeVisible({ timeout: 5000 })

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill form with valid credentials
    await page.fill('input[name="email"]', EXISTING_USER.email)
    await page.fill('input[name="password"]', EXISTING_USER.password)

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Should show user content (adjust based on actual implementation)
    await expect(page.locator('body')).toContainText(EXISTING_USER.nickname, {
      timeout: 5000,
    })
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.fill('input[name="email"]', EXISTING_USER.email)
    await page.fill('input[name="password"]', EXISTING_USER.password)
    await page.click('button[type="submit"]')

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Click logout button (adjust selector based on actual implementation)
    // This assumes there's a logout button/link in the header or navigation
    const logoutButton = page.locator('button:has-text("로그아웃")')
    await expect(logoutButton).toBeVisible({ timeout: 5000 })
    await logoutButton.click()

    // Should redirect to login page
    await expect(page).toHaveURL('/login', { timeout: 10000 })
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })

  test('should prevent access to auth pages when already logged in', async ({
    page,
  }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', EXISTING_USER.email)
    await page.fill('input[name="password"]', EXISTING_USER.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Try to access login page while logged in
    await page.goto('/login')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })

    // Try to access signup page while logged in
    await page.goto('/signup')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
  })
})
