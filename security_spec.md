# Security Specification - NU Laguna Feedback Portal

## Data Invariants
1. A feedback submission must have a valid category from the allowed set.
2. Ratings must be between 1 and 7.
3. Every submission must include `likedMost` and `improvements` text (enforced as non-empty strings with size limits).
4. `userId` is currently hardcoded as 'anonymous', but rules will allow for future auth transition.
5. `createdAt` must match the server's time (via `request.time` validation).
6. Admins can view all feedback. Regular visitors cannot read any feedback after submission.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Unauthorized Read**: Attempting to list `feedbacks/` as an unauthenticated user.
2. **Unauthorized Read (Admin Path)**: Attempting to read `admins/` as a non-admin.
3. **Ghost Field Injection**: Adding `isVerified: true` to a feedback document.
4. **Invalid Rating**: Submitting a rating of 10 or -1.
5. **ID Poisoning**: Using a 1MB string as a document ID.
6. **Shadow Update**: Overwriting someone else's feedback.
7. **Type Mismatch**: Sending `ratings` as a string instead of an object.
8. **PII Leak**: Reading a specific user's private info.
9. **Spam Attack**: Submitting a feedback with `likedMost` exceeding 5000 characters.
10. **State Shortcut**: Setting `status` to 'Resolved' during creation.
11. **Future Timestamp**: Setting `createdAt` to a year in the future.
12. **Owner Spoofing**: Setting `userId` to a specific admin's UID.

## Admin Setup
The following user is designated as a bootstrap admin:
- johnwilbensibayan@gmail.com
