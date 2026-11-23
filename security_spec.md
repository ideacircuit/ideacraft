# IdeaCircuit Firestore Security Specification

## 1. Data Invariants
1. Public website visitors can read `site_settings`, `portfolio_projects`, and `testimonials`, and can never write, modify, or delete any document.
2. Only verified authenticated administrators (`email_verified == true` and either the bootstrapped studio admin email or an entry in `/admins/{uid}`) can create, update, or delete `site_settings`, `portfolio_projects`, `testimonials`, or `admins`.
3. `portfolio_projects` and `testimonials` must enforce strict key allowlists (`hasAll` + `hasOnly`), string length bounds, bounded `deliverables` arrays (`1..10`), server-controlled timestamps (`request.time`), and immutable `authorId`/`createdAt` fields.
4. `site_settings` enforces `settingId == 'main'` and strict field bounds so oversized or shadow fields cannot be injected.
5. Path variables (`settingId`, `projectId`, `testimonialId`, `userId`, `inquiryId`, `suggestionId`, `bookingId`) must match `^[a-zA-Z0-9_-]+$` and be `<= 128` characters.
6. `inquiries` allows validated public `create` (strict `hasAll`/`hasOnly`, bounded strings, `createdAt == request.time`), while `get`, `list`, and `delete` are strictly restricted to verified admins (`PII Isolation`).
7. `suggestions` allows validated public `create` with initial `status == 'new'`, while `get`, `list`, status `update`, and `delete` are strictly restricted to verified admins (`PII Isolation`).
8. `call_bookings` allows validated public `create` with initial `status == 'pending'` and `createdAt == request.time`, while `get`, `list`, status `update` (`['status']`), and `delete` are strictly restricted to verified admins (`PII Isolation`).

## 2. Adversarial Payloads Tested ("Dirty Dozen")
1. **Unauthenticated Write**: Anonymous user attempts to create a `portfolio_projects` document -> `PERMISSION_DENIED`.
2. **Unverified Email Admin Spoof**: User signs in with unverified token (`email_verified: false`) matching admin email -> `PERMISSION_DENIED`.
3. **Non-Admin Authenticated Write**: Regular Google user attempts to update `site_settings/main`, `suggestions/{id}`, or `call_bookings/{id}` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: Admin or attacker injects `{ isVerified: true, extraSecret: 'abc' }` into `portfolio_projects`, `inquiries`, `suggestions`, or `call_bookings` -> `PERMISSION_DENIED` (`hasOnly` rejection).
5. **ID Poisoning**: Write to `/portfolio_projects/abc...1500chars` or `/call_bookings/abc...1500chars` -> `PERMISSION_DENIED` (`isValidId` check).
6. **Client Timestamp Forgery**: `createdAt` set to past/future client date instead of `request.time` -> `PERMISSION_DENIED`.
7. **Immutable Field Tampering**: Update attempts to change `createdAt` or `authorId`, or update any `/inquiries` document or non-status field on `/call_bookings` -> `PERMISSION_DENIED`.
8. **Oversized String DoS**: `overview` string > 2000 characters, inquiry `message` > 4000 characters, `suggestion` > 2000 characters, or call `notes` > 2000 characters -> `PERMISSION_DENIED`.
9. **Empty/Unbounded Array**: `deliverables: []` or 15 items -> `PERMISSION_DENIED`.
10. **Invalid Enum Value**: `category: 'Hacked'`, `deliveryChannel: 'unknown'`, `topic: 'Spam'`, or `channel: 'Telegram'` -> `PERMISSION_DENIED`.
11. **Self-Assigned Admin Escalation**: Non-admin tries to write `/admins/{ownUid}` -> `PERMISSION_DENIED`.
12. **Blanket List Scraping of PII & Admins**: Non-admin attempts `get` or `list` on `/admins`, `/inquiries`, `/suggestions`, or `/call_bookings` -> `PERMISSION_DENIED`.

