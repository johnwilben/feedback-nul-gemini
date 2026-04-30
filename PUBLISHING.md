# Publishing and Deployment Instructions

## 1. Firebase Admin Setup
Since we have implemented Username/Password login for the Admin Dashboard, you need to create the admin account in your Firebase Console.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project **feedback-nul**.
3. In the left sidebar, go to **Authentication**.
4. Go to the **Users** tab and click **Add user**.
5. Enter an email (e.g., `admin@nulaguna.edu.ph`) and a password (e.g., `laguna1900`).
6. Update the Admin Dashboard login in the app with these credentials.

## 2. GitHub Pages Deployment
To deploy this app to GitHub Pages:

1. **Build the project**:
   Run `npm run build` in your terminal. This will create a `dist` folder.
2. **Push to GitHub**:
   Initialize a git repo, add all files, and push to a GitHub repository.
3. **Configure GitHub Pages**:
   - In your GitHub repo, go to **Settings** > **Pages**.
   - Under **Build and deployment**, select **GitHub Actions** as the source.
   - You can use a standard Vite deployment action.
4. **Authorize your Domain**:
   - For Authentication and Firestore to work properly on GitHub Pages, you must add your GitHub Pages domain to the Firebase Authorized Domains list.
   - Go to [Firebase Console](https://console.firebase.google.com/) > **Authentication** > **Settings** > **Authorized Domains**.
   - Click **Add Domain** and enter your GitHub Pages URL (e.g., `username.github.io`).

**Important**: Because this is a client-side app, the `GEMINI_API_KEY` defined in AI Studio will be baked into the compiled JavaScript if it's present during the build. If you build it locally, make sure you have the environment variable set.

## 3. Feedback Submission
The feedback submission is now using direct Firestore writes with simplified rules for better reliability. Ensure your computer's date and time are correct to avoid security rule mismatches.
