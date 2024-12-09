import { test, expect } from '@playwright/test';

test('Select Lowest Fare Flight on EaseMyTrip', async ({ page }) => {
  // Step 1: Visit EaseMyTrip homepage
  await page.goto('https://www.easemytrip.com/');
  
  // Step 2: Handle any pop-ups or overlays
  try {
    const closePopup = page.locator('.emt-close'); 
    if (await closePopup.isVisible({ timeout: 5000 })) {
      await closePopup.click();
      console.log('Pop-up closed successfully.');
    }
  } catch (e) {
    console.log('No pop-up appeared or pop-up already dismissed.');
  }

  // Step 3: Select "Flights" tab (if not already selected)
  const flightsTab = page.locator('a[data-emt="Flights"]');
  if (await flightsTab.isVisible()) {
    await flightsTab.click();
    console.log('Flights tab selected.');
  }

  // Step 4: Enter "From" and "To" city details
  await page.click('#FromSector_show');
  await page.type('//input[@placeholder="From"]', 'Delhi', { delay: 100 });
  await page.waitForTimeout(1000); // Wait for dropdown suggestions

  
  await page.click('#Editbox13_show'); // Click on the "To" input field
  await page.type('//input[@placeholder="To"]', 'Mumbai', { delay: 100 }); // Enter city name
  await page.waitForTimeout(1000); 

  console.log('Entered departure and destination cities.');

  // Step 5: Open the departure date picker and select the lowest fare date
  await page.click('#ddate'); // Open the calendar
  await page.waitForSelector('.box', { timeout: 5000 });

  await page.waitForTimeout(3000); 

  const today = new Date().getDate(); // Get today's date as a number
  console.log(`Today's date is: ${today}`);

  const allDates = page.locator("//li[contains(@id, '12/2024') and not(contains(@class,'old-dt'))]");
  const dateCount = await allDates.count();

  let lowestFare = Infinity;
  let lowestFareDateIndex = -1;
  const currentMonth = '12';
  const currentYear = '2024';
  console.log(`${dateCount}`);

  for (let i = 0; i < dateCount; i++) {
    
    const liElement = await allDates.nth(i);
    const dateText = await liElement.innerText();
    const day = parseInt(dateText, 10);

    const fareText = await liElement.locator('//span').textContent();
    const fare = parseFloat(fareText.replace('₹', '').replace(',', '').trim());

    console.log(`Date: ${day}, Fare: ₹${fare}`);
    if (!isNaN(fare) && fare < lowestFare) {
        lowestFare = fare;
        lowestFareDateIndex = i;
    }
  }
  console.log(`${lowestFare}`);

//    Step 6: Click on the `li` element with the lowest fare
   const lowestFareLi = allDates.nth(lowestFareDateIndex);
   await lowestFareLi.click();

   expect(lowestFare).toBeLessThan(Infinity);

   // Step 7: Click "Search" for flights
  await page.click('//button[@class="srchBtnSe"]');
  await page.waitForLoadState('networkidle');
  console.log('Clicked search and loaded flight results.');

  await page.waitForTimeout(3000);

  // Step 8: Click on the "Book Now" button for the first flight (cheapest filter is already applied)
  const bookNowButton = await page.locator('button:has-text("Book Now")').first(); 
  await bookNowButton.click();
  console.log('Clicked on the "Book Now" button for the first flight.');

  await page.waitForTimeout(2000);

  const closePopupButton = page.locator("//div[@id='lgnBox']//div[@class='_crosslog']");
  await closePopupButton.click(); 

  // Step 9: Apply an Invalid coupon

  const promoCodeInput = page.locator('#txtCouponCode'); 
  const applyPromoButton = page.locator("//div[@id='divCouponCodeApply']//div[@class='cpn-r']");

  // Enter an invalid promo code (e.g., "INVALIDCODE123")
  await promoCodeInput.fill('INVALIDCODE123');

  // Click the Apply button
  await applyPromoButton.click();

  const errorMessage = page.locator("//p[@id='easeFareDetails1_promodiv']");
  await expect(errorMessage).toHaveText('Invalid Coupon');

  console.log("Applied Invalid Coupon");

  // Step 10: Apply a Valid Coupon

  const priceBefore = await page.locator('#spnGrndTotal').textContent(); 

  // Locate and click on the coupon
  const couponInput = page.locator('#rdoCpnBESTDEAL');
  await couponInput.click();

  await page.waitForTimeout(1000);

  const priceAfter = await page.locator('#spnGrndTotal').textContent(); 

  await expect(priceAfter).not.toEqual(priceBefore);

  console.log("Applied a valid coupon");

  await page.close();

});
