# Firestore Security Specification - Biashara Yako

## 1. Data Invariants
- **Business Identity**: Every piece of data (Sales, Expenses, Inventory) MUST be linked to a `businessId`.
- **Ownership**: A user can only access data where the `businessId` matches their own `profile.businessId`.
- **Role-Based Access**:
  - `Owner`: Full access to business data and settings.
  - `Manager`: Access to Sales, Expenses, and Inventory. Cannot change business settings.
  - `Staff`: Access to POS (Sales) and Inventory viewing. Cannot log expenses or view business analytics.
- **Auditability**: `createdAt` and `createdBy` fields are immutable after creation.
- **Integrity**: Sales terminal states (e.g., 'completed') cannot be reversed to 'pending'.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

1.  **Identity Spoofing**: An authenticated user (UID: `attacker_123`) attempts to create a business profile with `ownerId: "victim_456"`.
2.  **Cross-Tenant Leak**: User from `Business_A` attempts to `list` sales from `Business_B` by guessing the collection path or querying without a filter.
3.  **Privilege Escalation**: A `Staff` user attempts to update their own role to `Owner` in the `users` collection.
4.  **Admin Field Injection**: A user attempts to update `businessId` or `isAdmin` on their profile.
5.  **State Shortcut**: Updating a sale status directly from `pending` to `refunded` without passing through `completed`.
6.  **Resource Poisoning**: Creating an inventory item with a `name` string of 1MB to cause "Denial of Wallet".
7.  **Orphaned Record**: Creating a `sale` with a `businessId` that does not exist in the `businesses` collection.
8.  **Anonymous Write**: An unauthenticated user attempting to write to the `feedback` collection.
9.  **Immutable Violation**: Attempting to change the `createdAt` timestamp of a sale to last year.
10. **Shadow Update**: Updating a product price but also injecting a `discountCode: "ALL_FREE"` field that isn't in the schema.
11. **PII Leak**: A signed-in user fetching the private contact details of another business owner.
12. **Malicious ID**: Attempting to create a document with ID `../../hacked` to test path traversal.

## 3. Test Runner Definition (Conceptual)
Tests will be implemented in `firestore.rules.test.ts` to verify:
- Deny unauthenticated access to all paths except `feedback` (creation only).
- Deny writes to `businesses` if `request.auth.uid != resource.data.ownerId`.
- Enforce `isValidId()` on all document IDs.
- Validate `businessId` consistency across all collections.
