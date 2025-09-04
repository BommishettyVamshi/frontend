# MERN Screen Recorder - Frontend

## Overview

This is the **frontend** of the MERN Screen Recorder App, built using **React.js (Vite)**. It allows users to:

- Record their screen along with microphone audio.
- Preview, download, and upload recordings to the backend.
- View a list of uploaded recordings with options to play or delete.

The app provides a simple and user-friendly interface to manage screen recordings efficiently.

## Features

- **Screen & Audio Recording:** Capture your screen and microphone simultaneously.
- **Recording Timer:** Automatically stops recording after 3 minutes.
- **Preview & Download:** Preview your recording before downloading.
- **Upload Recordings:** Upload recordings to the backend and store them on Supabase storage.
- **View Uploaded Recordings:** Stream uploaded recordings directly in the app.
- **Delete Recordings:** Remove recordings from both the frontend list and backend storage.

## Tech Stack

- **Frontend:** React.js (Vite)
- **Styling:** CSS, Tailwind CSS
- **Icons:** React Icons
- **Popup Modals:** reactjs-popup
- **API Requests:** Fetch API

## Environment Variables

Create a `.env` file at the root of the frontend folder:

```env
VITE_API_URL=https://your-backend-url.onrender.com


## Project structure
frontend/
├─ public/             # Static assets
├─ src/
│  ├─ App.jsx          # Main app component
│  ├─ main.jsx         # Entry point
│  ├─ App.css          # Styles
|_ index.html          # root html
├─ package.json
├─ vite.config.js
├─ README.md
|_ .gitignore
|_ vite.config.js
|_ .env


## How to Run Locally
1. Clone the frontend repository:
   git clone https://github.com/your-username/frontend.git

2. Navigate to the project folder:
    cd frontend

3. Install dependencies:
    npm install

4. Navigate to the project folder:

5. Navigate to the project folder:
    npm run dev

6. Open the browser at http://localhost:5173.

## Deployment
 The frontend is deployed on Vercel at:
    https://frontend-eta-bay-40.vercel.app

## Author
Bommishetty Vamshi
```
