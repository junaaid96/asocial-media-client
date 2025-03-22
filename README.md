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
- View all posts in a feed
- Responsive design for all devices

## Tech Stack

- React.js
- React Router for navigation
- Firebase Authentication
- Context API for state management
- React Query for data fetching
- Tailwind CSS with DaisyUI for styling
- React Hook Form for form handling
- React Hot Toast for notifications
- ImgBB for image hosting

## Installation and Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/asocial-media-client.git
```

2. Install dependencies
```bash
cd asocial-media-client
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
REACT_APP_apiKey=your_firebase_api_key
REACT_APP_authDomain=your_firebase_auth_domain
REACT_APP_projectId=your_firebase_project_id
REACT_APP_storageBucket=your_firebase_storage_bucket
REACT_APP_messagingSenderId=your_firebase_messaging_sender_id
REACT_APP_appId=your_firebase_app_id
REACT_APP_imgbb_api=your_imgbb_api_key
```

4. Start the development server
```bash
npm start
```

## Project Structure

- `src/contexts` - Context providers for authentication and user data
- `src/layout` - Layout components for the application
- `src/pages` - Page components
- `src/routers` - Routing configuration and private route protection

## Backend Repository

The backend server for this application can be found at https://github.com/junaaid96/asocial-media-server
