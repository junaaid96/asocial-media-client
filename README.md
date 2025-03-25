# aSocial Media Client

A social media platform designed for introverts to connect and share their thoughts in a more comfortable environment.

## Live Site
https://asocial-media.web.app/

## Features

- User authentication with email/password and Google sign-in
- User profile creation and management
- Create, edit, and delete posts with images
- Comment on posts with edit and delete functionality
- Like/unlike posts
- View all posts in a feed with pagination
- Popular posts section based on like count
- Responsive design for all devices
- Real-time updates with React Query

## Tech Stack

- React.js
- React Router for navigation
- Firebase Authentication
- Context API for state management
- React Query for data fetching and cache management
- Tailwind CSS with DaisyUI for styling
- React Hook Form for form handling
- React Hot Toast for notifications
- ImgBB for image hosting
- date-fns for date formatting

## Key Components

### Authentication

The application uses Firebase Authentication and maintains user state through the AuthContext provider.

### User Data Management

User profiles are managed through the UserDataContext provider, which fetches and caches user information.

### Post Management

Users can:
- Create posts with text and images
- View their own posts in a dedicated section
- Edit and delete their posts
- Like posts from other users
- View all posts in a paginated feed

### Comments

The application supports:
- Adding comments to posts
- Editing and deleting your own comments
- Viewing comments with timestamps

### Responsive Design

The application is fully responsive with:
- Different layouts for mobile and desktop views
- Collapsible sections for better mobile experience
- Optimized image display

## Project Structure

- `src/contexts` - Context providers for authentication and user data
- `src/layout` - Layout components for the application
- `src/pages` - Page components
  - `Home` - Main landing page with post creation and feed
  - `Media` - User's personal posts
  - `About` - User profile information
  - `Login/Register` - Authentication pages
- `src/routers` - Routing configuration and private route protection

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   REACT_APP_apiKey=your_firebase_api_key
   REACT_APP_authDomain=your_firebase_auth_domain
   REACT_APP_projectId=your_firebase_project_id
   REACT_APP_storageBucket=your_firebase_storage_bucket
   REACT_APP_messagingSenderId=your_firebase_messaging_sender_id
   REACT_APP_appId=your_firebase_app_id
   REACT_APP_imgbb_api=your_imgbb_api_key
   ```
4. Run the development server:
   ```bash
   npm start
   ```

## Backend Repository

The backend server for this application can be found at https://github.com/junaaid96/asocial-media-server
