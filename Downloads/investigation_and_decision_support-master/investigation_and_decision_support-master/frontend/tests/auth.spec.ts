import { test, expect } from '@playwright/test';

test.describe('KSP Crime Intelligence Platform - End-to-End Authentication', () => {
  test('should load login page and authenticate user successfully', async ({ page }) => {
    // Start from local server
    await page.goto('http://localhost:3000/login');

    // Verify page headers
    await expect(page.locator('h2')).toContainText('Security Gateway Login');

    // Input Badge number and password
    await page.fill('input[type="text"]', 'SI-4921');
    await page.fill('input[type="password"]', 'Ksp@12345');

    // Click submit button
    await page.click('button[type="submit"]');

    // Verify redirected page location
    await expect(page).toHaveURL('http://localhost:3000/dashboard');

    // Verify command center sidebar is loaded
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside')).toContainText('SI Anitha Deshpande');
  });

  test('should display secure authorization alert for wrong password', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[type="text"]', 'SI-4921');
    await page.fill('input[type="password"]', 'WrongPassword123');
    await page.click('button[type="submit"]');

    // Wait for the feedback notification to show error
    await expect(page.locator('form').locator('..').locator('div').first()).toContainText('Invalid badge number or security password');
  });
});
