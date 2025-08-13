# Test Case Generator Backend

## Setup

1. Copy `.env.example` to `.env` and fill in your secrets.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

## Endpoints
- `/auth/github` - Start GitHub OAuth
- `/auth/github/callback` - OAuth callback
- `/api/github/user` - Get authenticated user
- (To be added) `/api/github/repos`, `/api/github/files`, `/api/github/file-content`, `/api/ai/summaries`, `/api/ai/testcode`, `/api/github/create-pr`
