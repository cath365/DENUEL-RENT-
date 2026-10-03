Updates performed:

- Added secure S3 presigned upload support in `/api/uploads/presign` and helper `lib/s3.ts`.
- Enhanced `CreatePropertyForm` to allow multi-image upload with presigned URLs and display upload progress; images are stored as public S3 URLs on the property record.
- Added `GET /api/properties/mine` endpoint and integrated a 'My listings' UI in `/dashboard/properties` to list and delete user properties.

Next recommended steps:
- Add edit form for properties and inline image re-ordering.
- Replace in-memory rate limiter with Redis for production and add robust retries for failed uploads.
- Add server-side validation of uploaded objects (via lambda or S3 event) to ensure only images are stored.

Recent additions:
- Implemented inquiries inbox APIs and UI: `/api/inquiries`, `/api/inquiries/{id}` and dashboard pages `/dashboard/inquiries` + thread view; updated `/api/messages` to create/manage threads.
- Added a notifications center: Notification model, `lib/notifications`, SSE subscription `/api/notifications/subscribe`, endpoints to list and mark notifications, a notifications toast component and a notifications page, and worker job `notification.send` to deliver emails. 
- Added unit tests for inquiries and message thread flows (`__tests__/inquiries.test.ts`) and notifications (`__tests__/notifications.test.ts`).
