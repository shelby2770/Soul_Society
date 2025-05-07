# Vercel Deployment Guide for Soul Society

This guide explains how to deploy the Soul Society application on Vercel.

## Prerequisites

- A Vercel account
- Git installed on your local machine
- Node.js >=18.0.0

## Deployment Steps

### Frontend Deployment

1. Login to your Vercel account or create one at [vercel.com](https://vercel.com)
2. Install Vercel CLI (optional):

   ```
   npm install -g vercel
   ```

3. Set up your environment variables:

   - Create a `.env` file in the `client` directory with:
     ```
     VITE_API_URL=https://your-backend-url.vercel.app
     ```
   - Or set these variables in the Vercel project settings

4. Deploy the frontend:
   - Push your repository to GitHub, GitLab, or Bitbucket
   - Import your repository in Vercel dashboard
   - Set the root directory to `client`
   - Set the build command to `npm run build`
   - Set the output directory to `dist`
   - Set framework preset to Vite
   - Click Deploy

### Backend Deployment

1. Deploy the backend:
   - Import your repository in Vercel dashboard
   - Set the root directory to `server`
   - Set the build command to `npm install`
   - Set the output directory to `/`
   - Set the development command to `node server.js`
   - Add the following environment variables:
     - `JWT_SECRET`: Your JWT secret key
     - `MONGODB_URI`: Your MongoDB connection string
   - Click Deploy

## Important Notes

- The application is configured to allow all origins with CORS settings
- Socket.IO is set up to work with Vercel's serverless environment
- Both frontend and backend have proper Vercel configuration files
- Make sure your MongoDB Atlas database is set to allow connections from anywhere (`0.0.0.0/0`)

## Troubleshooting

- If you encounter CORS issues, verify the origin settings in `server/app.js` and `server/server.js`
- For Socket.IO connection issues, check the client's connection URL and make sure it matches your deployed backend URL
- If you see 504 Gateway Timeout errors, consider optimizing your API endpoints or implementing serverless functions with proper timeout settings


