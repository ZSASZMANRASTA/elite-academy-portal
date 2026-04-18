# Super Admin Setup Guide

This guide explains how to create and manage super admin accounts for Adam's Junior Academy.

## Important: Security First

- **Only Supabase** is used for authentication and data storage
- **No other cloud services** are integrated
- **Admin accounts are restricted** - only existing admins can create new admins
- **Registration prevents admin creation** - users can only register as students or teachers

## Creating Your First Super Admin Account

You have two options to create your initial super admin account:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to **Authentication → Users**
3. Click **"Add user"** button
4. Fill in the details:
   - Email: `admin@adamsjunior.ac.ke` (or your preferred admin email)
   - Password: Generate a secure password or let Supabase auto-generate one
   - Uncheck "Auto confirm user" if you want them to confirm via email first
5. Click **"Create user"**
6. Copy the **User ID** (UUID) that appears
7. In your app:
   - Go to **Users Management** page in the dashboard
   - Find the newly created user
   - Use the role dropdown to change from "Student" to "Admin"
8. The user can now log in and access admin features

### Option 2: Using the App's Admin Setup (After First Admin Exists)

Once you have your first admin account:

1. Log in to the app as the super admin
2. Go to the Dashboard
3. Click **"Admin Setup"** button (bottom of sidebar)
4. Follow the on-screen instructions to create additional admin accounts

## Managing Admins

### View All Admins
1. Go to Dashboard → **Users**
2. Use the filter dropdown to select **"Admins"**

### Change User Roles
1. Go to Dashboard → **Users**
2. Find the user in the list
3. Click the role dropdown and select the new role:
   - **Student** - Can access courses, quizzes, and view their progress
   - **Teacher** - Can create and manage courses, assignments, and view student progress
   - **Admin** - Full system access, can manage all content and users

### Approve/Revoke Users
1. Go to Dashboard → **Users**
2. Click the **Approve** or **Revoke** button next to each user
3. Only approved users can access their dashboards

## Admin Impersonation

Admins can "view as" other roles to test features:

1. While logged in as admin, go to any dashboard page
2. At the bottom of the sidebar, you'll see a "Viewing as" dropdown
3. Select:
   - **Admin** - See the admin dashboard
   - **Teacher** - See what teachers see
   - **Student** - See what students see
4. All navigation and features will change to match that role
5. You remain logged in as an admin - no one else can see you're viewing as another role

## Database Structure

Admin accounts are stored in:
- **auth.users** - Supabase authentication (email/password)
- **profiles** - User profile information
- **user_roles** - Role assignments (student, teacher, admin)

All admin operations are protected by Row Level Security (RLS) policies that ensure:
- Only admins can view and manage user roles
- Users can only view their own roles
- Unauthorized access is automatically blocked

## Security Features

✓ **Password Reset via Email** - Users can reset forgotten passwords
✓ **Role-Based Access Control** - Different features for different roles
✓ **Row Level Security** - Database-level protection against unauthorized access
✓ **Admin-Only User Management** - Only admins can create or modify other admins
✓ **No Third-Party Services** - All data stays in Supabase
✓ **Audit Trail** - Admins can view when users were created and modified

## Troubleshooting

### Can't find the Admin Setup button?
- You must be logged in as an admin
- The button appears at the bottom of the sidebar in the dashboard

### Need to reset an admin password?
1. Go to Supabase Dashboard
2. Navigate to Authentication → Users
3. Find the user
4. Click the three-dot menu
5. Select "Reset password"
6. User will receive a password reset email

### An admin account isn't working?
1. Check if the account is "Approved" in the Users page
2. Verify the user has the "Admin" role
3. Try resetting the password via Supabase Dashboard
4. Check browser console for any error messages

## API Reference

### Create Admin (Edge Function)
Only authenticated admins can call this endpoint.

```bash
POST /functions/v1/create-admin
Authorization: Bearer {USER_JWT_TOKEN}
Content-Type: application/json

{
  "email": "newadmin@adamsjunior.ac.ke",
  "full_name": "New Admin Name"
}
```

Response:
```json
{
  "success": true,
  "message": "Admin account created successfully",
  "user_id": "uuid",
  "email": "newadmin@adamsjunior.ac.ke"
}
```

## Best Practices

1. **Create multiple admins** - Don't rely on a single super admin account
2. **Use strong passwords** - All admins should use secure, unique passwords
3. **Audit user list regularly** - Check the Users page monthly
4. **Remove inactive admins** - Keep only active admins in the system
5. **Change default admin email** - Replace the default `admin@adamsjunior.ac.ke` with your actual admin email
6. **Backup recovery info** - Store admin email addresses securely for password recovery

## Support

If you need help:
1. Check the Supabase documentation: https://supabase.com/docs
2. Review the Users management page in your dashboard
3. Check browser console for error messages
