# Homepage Admin Usage Guide

This guide is for staff managing the BrandnBeauty homepage before launch. Use the existing admin pages only. Do not edit code, database rows, or server files directly.

## Short Admin SOP

### 1. Update Hero Banners

Admin page: **Homepage CMS**

1. Open **Homepage CMS** from the admin sidebar.
2. In the hero banner area, review the existing slides.
3. Add a new banner only when you have launch-ready copy, image, and link.
4. Keep hero copy short: headline, supporting line, and one clear button.
5. Use a real customer route for the button, such as `/products`, `/category/skincare`, `/concern/acne`, `/brand/brandnbeauty`, or another working storefront URL.
6. Save the Homepage CMS changes.
7. Open the storefront homepage and confirm the banner appears correctly on desktop and mobile.

### 2. Set Hero Active or Inactive

Admin page: **Homepage CMS**

1. Find the hero slide in the hero banner list.
2. Set the slide to **Active** when it should appear on the storefront.
3. Set the slide to **Inactive** when it should remain saved but hidden.
4. Save changes.
5. Refresh the storefront homepage to confirm inactive slides are hidden.

Keep at least one polished active hero before launch. If no active hero is available, the storefront should fall back safely, but the launch homepage looks better with a real active banner.

### 3. Reorder Hero Slides

Admin page: **Homepage CMS**

1. Use the hero list order controls or sort order fields.
2. Put the strongest launch banner first.
3. Keep seasonal or lower-priority banners after the main banner.
4. Save changes.
5. Refresh the storefront homepage and confirm the first visible banner is correct.

Recommended order:

1. Main launch campaign
2. Current offer or collection
3. Brand/category/concern spotlight

### 4. Add or Edit Offers

Admin pages: **Homepage CMS** and **Offers & Deals**

Use **Offers & Deals** for normal offer management. Use **Homepage CMS** only for homepage-specific offer display fields when available.

1. Open **Offers & Deals**.
2. Add or edit the offer title, description, discount text, image, dates, status, and sort order if available.
3. Use honest copy only. Do not add fake urgency, fake stock pressure, or unsupported claims.
4. Set the offer to **Active** only when it should appear to customers.
5. Save the offer.
6. Check the homepage offer section and the linked customer route.

Safe offer copy examples:

- "Explore Current Offers"
- "Selected skincare essentials"
- "Limited-time homepage edit"
- "Shop available deals"

Avoid:

- "Only 2 left" unless stock data proves it
- "2.3k sold this week"
- "Guaranteed results"
- "Free shipping" unless the shipping policy supports it

### 5. Set Editor Picks

Admin page: **Homepage CMS**

1. Open **Homepage CMS**.
2. Go to the editor picks area.
3. Select products from the available product list when shown.
4. If entering product IDs manually, use only live products that are visible on the storefront.
5. Save changes.
6. Refresh the homepage and confirm the selected products appear.
7. Click each product card to confirm the product detail page opens.

Before launch, choose products that have:

- Product name
- Price
- Product image
- Stock available
- Active storefront status
- Clean description

### 6. Update Navigation Menu

Admin page: **Header & Navigation**

1. Open **Header & Navigation**.
2. Keep the primary menu simple and launch-ready.
3. Use only working storefront routes.
4. Save changes.
5. Refresh the storefront homepage and test each visible navigation link.

Recommended launch navigation:

- Home: `/`
- Shop: `/products`
- Categories: `/category/skincare` or another active category route
- Concerns: `/concern/acne` or another active concern route
- Brands: `/brand/brandnbeauty` or another active brand route

Do not add links to wishlist, login, account, advanced search, or future pages unless those pages are live and customer-safe.

### 7. Update Footer

Admin page: **Footer CMS**

1. Open **Footer CMS**.
2. Review brand text, footer groups, footer links, and social links.
3. Use real routes for clickable links.
4. Leave a footer item as plain text if the real route does not exist yet.
5. Remove placeholder phone, email, Messenger, or social profile values.
6. Save changes.
7. Refresh the homepage and confirm the footer has no `#` links or fake contact details.

Safe footer practice:

- Use neutral support wording when live support details are not ready.
- Keep policy labels visible only as non-clickable text if policy pages are not live.
- Add social links only when the public profile URLs are real.

### 8. Add Featured Reviews

Admin page: **Reviews & Real Results**

1. Open **Reviews & Real Results**.
2. Add or edit a review only when the content is approved for public display.
3. Mark the review as approved or active if it should appear.
4. Set featured status only for reviews suitable for the homepage.
5. Save changes.
6. Refresh the homepage and confirm the review appears in the real results section.

Before featuring a review, check:

- Reviewer name is acceptable for public display.
- Rating and review text are clear.
- No private contact details are shown.
- No medical or guaranteed-result claim is included.
- Image or media, if used, is approved.

### 9. What Not To Touch

Do not change these unless engineering has confirmed the change is safe:

- Code files
- PHP endpoint files
- Database tables directly
- Environment files or credentials
- Upload folder permissions
- Payment method behavior
- Order status values
- Product stock by editing hidden fields
- Footer or navigation JSON outside the admin UI
- Any button or section labeled **Coming later** or **Preview only**

Do not create fake customer trust signals, fake sales numbers, fake reviews, fake support channels, or fake policy pages.

## Homepage Launch Checklist

Use this checklist before launch or before a major campaign update.

- Hero has at least one active, polished banner.
- Hero image loads on desktop and mobile.
- Hero CTA goes to a real customer route.
- Inactive hero slides stay hidden.
- Hero order puts the strongest banner first.
- Featured products or editor picks are active, in stock, and clickable.
- Categories shown on the homepage have working category pages.
- Concerns shown on the homepage have working concern pages.
- Brands shown on the homepage have working brand pages.
- Offers are active only when they are real and current.
- Offer CTA goes to a real route.
- Reviews are approved, featured intentionally, and free of private details.
- Trust badges use realistic wording.
- Navigation links all open real storefront pages.
- Footer has no fake phone, email, Messenger, or social profile.
- Footer has no clickable `#` links.
- Policy/support items are either real links or non-clickable labels.
- Currency renders correctly as `৳`.
- Check marks, bullets, and copyright text render correctly.
- Homepage looks acceptable on mobile.
- Storefront homepage loads after refreshing the browser.

## Common Mistakes To Avoid

- Activating a hero before checking its image and CTA.
- Leaving test copy visible after a smoke test.
- Linking a CTA to `#`.
- Adding placeholder support contact details.
- Featuring products that are inactive, out of stock, or missing images.
- Using sales claims that are not backed by real data.
- Adding too many hero slides and burying the main launch message.
- Forgetting to save after reordering hero slides.
- Editing navigation labels without testing the routes.
- Making policy links clickable before the policy pages exist.
- Marking every review as featured instead of choosing the strongest approved ones.
- Changing payment, order, stock, or backend settings while only trying to update homepage content.
