# ALIYAR MANDI Website Handover

## Current status

The site is a working preview. Its public menu includes sample placeholder categories and items based on the supplied reference image. Existing Firestore menu records also appear and are clearly labeled as samples. No restaurant menu, prices, photos, or contact details have been verified by the owner.

The public menu reads active categories and available items from Firestore and updates when those records change. The admin dashboard supports menu and category management. Menu photos can use an HTTPS image URL or a file committed under `assets/images/`; Firebase Storage is not configured.

## Owner details needed before an official launch

- Approved item names, descriptions, prices, and availability
- Approved food and restaurant photographs
- Confirmed restaurant story, address, phone number, WhatsApp number, and opening hours
- The restaurant owner's Firebase Authentication UID

Enter confirmed contact details in `contact.js`. Contact and WhatsApp links remain hidden or show a confirmation placeholder while their settings are blank.

## Admin access

`admin.js` currently lists one allowed admin UID. Add the restaurant owner's UID to `allowedAdmins` before handover so the owner's account can open the dashboard. Do not put passwords or service-account keys in this repository. Firestore Security Rules remain the security boundary and are managed in Firebase, outside this repository.

## Before publishing as the restaurant's official site

1. Replace the sample menu with owner-approved information and remove the demo placeholders.
2. Add approved photos to `assets/images/` or enter verified HTTPS image links.
3. Fill `contact.js` with confirmed contact details.
4. Add and test the owner's admin UID; verify Firestore rules still allow only authorized admins to write.
5. Check the public site and admin dashboard at desktop and mobile widths.
6. Publish the reviewed files through the repository's GitHub Pages deployment.

Until these items are confirmed, describe the public site as a preview rather than the restaurant's final website.
