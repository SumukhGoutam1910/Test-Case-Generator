# Deployment Guide

## Frontend (React)
- Deploy to Vercel or Netlify
- Set `REACT_APP_API_URL` to your backend URL if needed

## Backend (Express)
- Deploy to Render or Railway
- Set environment variables:
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `GITHUB_CALLBACK_URL`
  - `SESSION_SECRET`
  - `GEMINI_API_KEY`

## Notes
- Use HTTPS and set CORS origins to your frontend domain in production
- Never commit your `.env` file
