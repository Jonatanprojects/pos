import { test, expect } from '@playwright/test';

test.describe('NexusPOS E2E Workflows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the base URL of the dev server
    await page.goto('/');
  });

  test('should enforce route protection and require login', async ({ page }) => {
    // By default, accessing the page should prompt the login PIN pad
    await expect(page.locator('text=Ingresa tu PIN de Acceso')).toBeVisible();
    
    // Attempting to locate the sidebar menu should fail or be hidden
    await expect(page.locator('aside')).not.toBeVisible();
  });

  test('should login successfully with Cashier PIN and open cash session', async ({ page }) => {
    // PIN 2222 is for Laura García (cajera)
    await page.click('button:has-text("2")');
    await page.click('button:has-text("2")');
    await page.click('button:has-text("2")');
    await page.click('button:has-text("2")');

    // Confirm cashier interface is loaded (Sidebar should be visible and active module should be POS)
    await expect(page.locator('text=Estado de caja')).toBeVisible();
    await expect(page.locator('text=Debes abrir la caja antes de vender')).toBeVisible();

    // Open cash session
    await page.click('button:has-text("Abrir caja")');
    await page.fill('input[placeholder="Monto inicial"]', '100000');
    await page.click('button:has-text("Confirmar Apertura")');

    // Warning should disappear and cashier state should be unlocked
    await expect(page.locator('text=Caja abierta')).toBeVisible();
  });

  test('should complete a mixed payment sale successfully', async ({ page }) => {
    // Login as Admin (PIN 1111)
    await page.click('button:has-text("1")');
    await page.click('button:has-text("1")');
    await page.click('button:has-text("1")');
    await page.click('button:has-text("1")');

    // Add first product to cart
    await page.click('text=Coca-Cola 350ml');
    await expect(page.locator('text=Carrito (1)')).toBeVisible();

    // Add second product to cart
    await page.click('text=Agua Cristal 600ml');
    await expect(page.locator('text=Carrito (2)')).toBeVisible();

    // Go to checkout
    await page.click('button:has-text("Cobrar")');

    // Select mixed payment methods (Efectivo & Tarjeta)
    await page.click('button:has-text("Tarjeta")');

    // Fill payments
    await page.fill('input[placeholder*="Efectivo"]', '2000');
    await page.fill('input[placeholder*="Tarjeta"]', '2300');

    // Complete sale
    await page.click('button:has-text("Completar venta")');

    // Check success popup
    await expect(page.locator('text=¡Venta completada!')).toBeVisible();
    await page.click('button:has-text("Nueva venta")');

    // Cart should be empty
    await expect(page.locator('text=Carrito vacío')).toBeVisible();
  });
});
