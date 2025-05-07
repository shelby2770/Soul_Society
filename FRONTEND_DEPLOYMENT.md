# Frontend Deployment Guide for Soul Society

This guide explains how to deploy the Soul Society frontend on Vercel, connecting to your Render-hosted backend.

## Prerequisites

- A Vercel account
- Git repository with your code
- Node.js >=18.0.0
- Backend already deployed at https://soul-society.onrender.com/

## Deployment Steps

### Frontend Deployment to Vercel

1. Login to your Vercel account or create one at [vercel.com](https://vercel.com)

2. Import your GitHub repository in the Vercel dashboard:

   - Click "Add New" → "Project"
   - Select your repository
   - Configure the project:
     - Root Directory: `client`
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. Add the environment variable:

   - Name: `VITE_API_URL`
   - Value: `https://soul-society.onrender.com`

4. Click "Deploy"

## Post-Deployment Verification

After deployment completes, verify that:

1. The frontend is loading correctly
2. API requests to the backend are working
3. Socket.IO connection is established properly
4. Login/registration functionality works as expected

## Troubleshooting

If you encounter issues:

1. **CORS Problems**: Check the browser console for CORS errors. The backend on Render has been configured to allow all origins, but you may need to verify the settings.

2. **Socket.IO Connection Issues**: If real-time features don't work, check the Socket.IO connection in the browser console. Make sure the frontend is connecting to the correct backend URL.

3. **API Requests Failing**: Verify that the environment variable `VITE_API_URL` is correctly set in Vercel.

4. **Build Failures**: Check the build logs on Vercel for any errors.

## Useful Commands

For local testing before deployment, use:

```bash
# Set the backend URL environment variable locally
export VITE_API_URL=https://soul-society.onrender.com

# Run the development server
npm run dev
```

This ensures your local development setup uses the same backend as your production deployment.
