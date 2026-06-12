# Commander Member Privilege Management Feature

## Overview

Commanders (and Officers/Owners) can now manage member roles and access privileges within their organization.

## Feature Capabilities

### Who Can Manage Privileges?

- **OWNER**: Full control to manage all members and roles
- **OFFICER**: Can manage members and assign roles (except OWNER role)
- **COMMANDER**: Can manage member roles and update team assignments
- **TEAM_LEADER**: Cannot manage privileges (view-only)
- **MEMBER**: Cannot manage privileges (view-only)
- **GUEST**: Cannot manage privileges (view-only)

### What Can Be Changed?

Commanders and above can:

1. **Update Member Roles** - Assign any role from OWNER → GUEST
2. **Remove Members** - Remove members from the organization
3. **View Permissions** - See current and available permissions for each role
4. **Member Details** - View member information (name, email, Star Citizen handle, join date)

### Role Permission Details

#### OWNER

- Edit organization settings
- Invite members  
- Create and edit operations
- Assign member roles
- Invite other organizations
- Post after-action reports
- Remove members
- Full organizational control

#### OFFICER

- Invite members
- Create and edit operations
- Assign member roles
- Post after-action reports
- Manage organization operations
- **Cannot**: Remove the organization owner

#### COMMANDER

- Create and edit operations
- Assign roles within operations
- Post after-action reports
- Manage subordinates/team assignments
- **Cannot**: Change other COMMANDER/OFFICER/OWNER roles

#### TEAM_LEADER

- Create operations
- Assign team members to operations
- View private operations
- Team-level tactical authority

#### MEMBER

- View private operations
- Participate in missions
- Standard contributor

#### GUEST

- View public operations only
- No write permissions

## User Interface

### Access Point

Navigate to: `/organizations/{organizationId}/members-privileges`

### Features in UI

1. **Member List Card**
   - Shows all organization members
   - Displays current role with color-coded badge
   - Shows member name, email, SC handle, join date

2. **Role Management**
   - Dropdown to select new role
   - Instant role update on change
   - Automatic feedback notifications

3. **Permission Details**
   - "Info" button on each member card
   - Shows all current permissions for their role
   - Educational reference for role capabilities

4. **Member Removal**
   - "Remove" button (except for the logged-in user)
   - Confirmation dialog before removal
   - Prevents accidental removal of user themselves

5. **Permission Reference**
   - Visual guide showing all 6 roles
   - Color-coded role badges
   - Description of each role's purpose

## API Endpoints

### GET /api/organizations/{organizationId}/members/privileges

Retrieve all members and their current roles.
**Permission**: COMMANDER role or higher

**Response**:
```json
[
  {
    "memberId": "member-id",
    "userId": "user-id",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "userImage": null,
    "starCitizenHandle": "JohnD",
    "currentRole": "COMMANDER",
    "joinedAt": "2026-04-25T10:00:00Z"
  }
]
```

### POST /api/organizations/{organizationId}/members/privileges

Update a member's role.
**Permission**: OFFICER role or higher

**Request**:
```json
{
  "memberId": "member-id",
  "newRole": "COMMANDER"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Member has been promoted to COMMANDER."
}
```

### DELETE /api/organizations/{organizationId}/members/privileges

Remove a member from the organization.
**Permission**: OFFICER role or higher

**Request**:
```json
{
  "memberId": "member-id"
}
```

**Response**:
```json
{
  "success": true,
  "message": "John Doe has been removed from the organization."
}
```
 Features

### Permission Checks

### Permission Checks
- All operations verify the actor's role in the organization
- Site admins can bypass organizational role checks
- Cannot remove yourself (except as admin)
- Cannot remove OWNER role without being OWNER/ADMIN
- Cannot assign OWNER role without being OWNER/ADMIN


### Validation
- Role values are validated against allowed enum values
- Member ownership is verified against organization
- All changes are audit-tracked in Prisma


### Error Handling
- Clear error messages for permission denied
- Validation errors for invalid role assignments
- Graceful handling when member not found

## Server-Side Functions

Loads all members with their roles and user details. Requires COMMANDER+ permission.

### `updateMemberRole(actorId, organizationId, memberId, newRole)`

Updates a member's role. Includes role hierarchy checks and prevents self-removal.

### `removeMemberFromOrganization(actorId, organizationId, memberId)`

Removes a member from the organization. Includes safeguards for OWNER role.

### `getRolePermissionDetails(role)`

Returns permission descriptions for each role. Used for UI education.

## Implementation Notes

### Files Added

- `src/server/member-privilege-management.ts` - Server-side logic
- `src/components/member-privilege-manager.tsx` - React UI component  
- `src/app/api/organizations/[organizationId]/members/privileges/route.ts` - API endpoints
- `src/app/organizations/[organizationId]/members-privileges/page.tsx` - Privileges page

### Changes to Existing Files

- `src/lib/permissions.ts` - Added COMMANDER and GUEST to `orgRolePowers`

### Database

No schema changes required. Uses existing `OrganizationMember` model with `role` field.

## Usage Example

As a COMMANDER, to manage team members:

1. Navigate to organization settings
2. Click "Member Privileges"
3. See list of all organization members with current roles
4. For each member:
   - Click "Info" to see their permissions
   - Use dropdown to change role
   - Click "Remove" to eject from organization
5. Changes apply immediately with success feedback

## Future Enhancements

Potential additions to this feature:


Potential additions to this feature:
- Bulk role updates
- Role history/audit log
- Provisional roles with expiration dates
- Permission grouping presets
- Custom role templates
- Attendance tracking per role
- Role-based operation auto-assignments
