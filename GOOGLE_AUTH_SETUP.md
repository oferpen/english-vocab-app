# Google Authentication Setup

This app now supports Google OAuth login for parent accounts. Users can sign in with Google, and if they don't have an account, one will be created automatically.

## Setup Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For local development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://your-domain.com/api/auth/callback/google`
   - Copy the Client ID and Client Secret

### 2. Set Environment Variables

Add these to your `.env` file (local) and Vercel environment variables (production):

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3000  # For local dev
NEXTAUTH_SECRET=your_random_secret_here  # Generate with: openssl rand -base64 32
```

For production on Vercel:
- `NEXTAUTH_URL` should be your production URL (e.g., `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET` should be a random string (generate with `openssl rand -base64 32`)

### 3. Update Database Schema

Run the database migration to add the new fields:

```bash
npx prisma db push
```

Or if using migrations:

```bash
npx prisma migrate dev --name add_google_auth
```

### 4. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/parent`
3. You should see a "התחבר עם Google" (Sign in with Google) button
4. Click it and complete the Google OAuth flow
5. A new parent account will be created automatically if it doesn't exist

## Features

- **Auto-create accounts**: New users are automatically created when they sign in with Google
- **Link existing accounts**: If a user has a PIN-based account with the same email, Google auth will be linked to it
- **Dual authentication**: The app supports both PIN-based and Google OAuth authentication
- **Session management**: Uses NextAuth.js for secure session handling

## Notes

- Users can still use PIN authentication if they prefer
- Google authentication takes precedence if both are available
- The parent account email is used to identify the user across sessions
