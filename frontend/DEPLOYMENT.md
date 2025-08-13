# Deployment Guide

This guide provides comprehensive instructions for deploying the frontend application to production.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Build Commands](#build-commands)
- [Hosting Steps](#hosting-steps)
- [Troubleshooting](#troubleshooting)
- [Post-Deployment Verification](#post-deployment-verification)

## Environment Variables

### Required Environment Variables

The application requires the following environment variables to function properly:

#### Production Environment
```bash
REACT_APP_API_BASE=https://your-backend-api-url.com
```

#### Development Environment
```bash
REACT_APP_API_BASE=https://study1-0.onrender.com
```

### Setting Environment Variables

#### For Netlify
1. Go to your site dashboard in Netlify
2. Navigate to **Site settings** > **Environment variables**
3. Add the following variables:
   - `REACT_APP_API_BASE`: Your backend API URL

#### For Vercel
1. Go to your project dashboard in Vercel
2. Navigate to **Settings** > **Environment Variables**
3. Add the environment variables for Production, Preview, and Development environments

#### Local Development
Create a `.env.local` file in the root directory (this file should not be committed):
```bash
REACT_APP_API_BASE=http://localhost:5000
```

## Build Commands

### Standard Build Process

```bash
# Install dependencies
npm install

# Run tests (optional but recommended)
npm test -- --coverage --watchAll=false

# Build for production
npm run build
```

### Build Configuration

The application uses Create React App's default build configuration:
- **Build folder**: `build/`
- **Node version**: 18 (specified in netlify.toml)
- **Build command**: `npm run build`

### Build Output

After running `npm run build`, the following structure will be created:
```
build/
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── index.html
├── manifest.json
└── other static assets
```

## Hosting Steps

### Netlify Deployment (Recommended)

#### Automatic Deployment via Git
1. **Connect Repository**:
   - Login to Netlify
   - Click "New site from Git"
   - Connect your GitHub/GitLab repository
   - Select the repository containing this frontend code

2. **Configure Build Settings**:
   - **Base directory**: Leave empty (root)
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

3. **Deploy**:
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site

#### Manual Deployment
```bash
# Build the application
npm run build

# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=build
```

### Vercel Deployment

#### Via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Build and deploy
npm run build
vercel --prod
```

#### Via Git Integration
1. Connect your repository to Vercel
2. Configure build settings:
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Other Static Hosting Services

#### GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"predeploy": "npm run build",
"deploy": "gh-pages -d build"

# Deploy
npm run deploy
```

#### AWS S3 + CloudFront
```bash
# Build the application
npm run build

# Sync to S3 bucket (requires AWS CLI)
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Troubleshooting

### CORS Issues

#### Symptoms
- API requests failing with CORS errors
- Console errors mentioning "Access-Control-Allow-Origin"
- Network requests blocked by browser

#### Solutions

1. **Backend Configuration** (Primary Solution):
   ```javascript
   // Ensure backend allows your frontend domain
   app.use(cors({
     origin: [
       'https://your-frontend-domain.com',
       'https://your-netlify-app.netlify.app',
       'http://localhost:3000' // for development
     ],
     credentials: true
   }));
   ```

2. **Check Environment Variables**:
   ```bash
   # Verify API base URL is correct
   echo $REACT_APP_API_BASE
   ```

3. **Proxy Configuration** (Development):
   Add to package.json for local development:
   ```json
   {
     "proxy": "http://localhost:5000"
   }
   ```

### Build Failures

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### Dependency Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Version Conflicts
```bash
# Check for audit issues
npm audit fix

# Update dependencies if safe
npm update
```

### Cache Invalidation

#### Netlify
```bash
# Clear Netlify cache via CLI
netlify dev --clear-cache

# Or trigger new build to clear cache
netlify build
```

#### Browser Cache Issues
1. **Service Worker Issues**:
   - Clear application data in browser dev tools
   - Check if service worker is registered and update it

2. **Static Asset Caching**:
   - Verify build generates unique hash filenames
   - Check cache headers in network tab

3. **CDN Cache**:
   - Wait for TTL expiration
   - Use cache-busting parameters if necessary

#### Manual Cache Clearing
```bash
# For CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"

# For Vercel (automatic on deployment)
vercel --prod

# For Netlify (clear via dashboard or redeploy)
netlify deploy --prod --dir=build
```

### Common Build Errors

#### "Module not found" Errors
```bash
# Check import paths and case sensitivity
# Ensure all dependencies are installed
npm install

# Check for missing files
ls -la src/
```

#### "Failed to minify" Errors
```bash
# Check for syntax errors in code
# Ensure ES6+ features are properly transpiled
npm run build -- --verbose
```

#### Environment Variable Issues
```bash
# Verify environment variables are prefixed with REACT_APP_
# Check .env files are properly formatted (no spaces around =)
# Restart development server after adding new env vars
```

## Post-Deployment Verification

### Checklist

1. **Application Loads**:
   - [ ] Site loads without errors
   - [ ] No console errors in browser dev tools
   - [ ] Static assets load properly

2. **API Connectivity**:
   - [ ] API calls succeed
   - [ ] Authentication works
   - [ ] Data loads correctly

3. **Functionality**:
   - [ ] User authentication flow
   - [ ] Room creation and joining
   - [ ] All features work as expected

4. **Performance**:
   - [ ] Page load times are acceptable
   - [ ] Images and assets optimize properly
   - [ ] Service worker caches resources

### Monitoring

#### Health Check Endpoints
Monitor the following:
- Frontend application availability
- Backend API health (`${REACT_APP_API_BASE}/health`)
- Authentication service status

#### Logging
- Check browser console for errors
- Monitor backend API logs
- Set up error tracking (Sentry, Bugsnag, etc.)

## Additional Resources

### Documentation Links
- [Create React App Deployment](https://create-react-app.dev/docs/deployment/)
- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)

### Support
For deployment issues:
1. Check this troubleshooting guide first
2. Review application logs
3. Verify environment configuration
4. Contact the development team with specific error messages

---

**Last Updated**: Add current date when merging
**Version**: 1.0.0
