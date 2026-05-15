# Security Specification for Biashara Yako POS

## Data Invariants
1. **User Identity & State**: Every write operation (except register) requires an authenticated user with `status == "active"`.
2. **Business State**: Every operation related to a business (branches, products, sales, etc.) requires the business to have `status == "active"`.
3. **Role-Based Access**:
   - `super_admin`: Total access.
   - `business_owner`: Access to everything under their `businessId`.
   - `manager`: Access to everything under their `branchId`.
   - `salesperson`: Access to POS and their own sales in their `branchId`.
4. **Relational Integrity**: 
   - Branches must point to a valid Business.
   - Products, Sales, Expenses must point to a valid Branch.
5. **Immutability**: `createdAt` and `createdBy` fields must not change after creation.
6. **Temporal Check**: Sales can only be edited within 2 hours of creation.

## The "Dirty Dozen" Payloads (Denial Tests)
1. **Identity Spoofing**: Attempt to create a user with a different `createdBy` than self.
2. **Role Escalation**: A `salesperson` trying to update their own role to `manager`.
3. **Ghost Writes**: A user from Branch A trying to create a sale in Branch B.
4. **Business Lockdown Bypass**: A user from a `suspended` business trying to create a sale.
5. **ID Poisoning**: Creating a product with a 2KB string as ID.
6. **Value Poisoning**: Setting `sellingPrice` to a negative number or a string.
7. **Orphaned Sale**: Creating a sale without a valid `branchId`.
8. **Shadow Field**: Adding `isVerified: true` to a business document.
9. **Timestamp Fraud**: Setting `createdAt` to a year in the future.
10. **State Shortcut**: Voiding a sale that doesn't belong to the user's branch.
11. **PII Leak**: A salesperson trying to read the super_admin's private profile.
12. **Out-of-Window Edit**: Editing a sale created 10 hours ago.

## Test Runner Plan
- Use `firestore.rules.test.ts` with `@firebase/rules-unit-testing`.
- Mock auth states for each role.
- Verify each payload returns `PERMISSION_DENIED`.
