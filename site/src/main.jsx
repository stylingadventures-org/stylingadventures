import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './ui/Layout.jsx'
import Home from './routes/Home.jsx'
import Episodes from './routes/Episodes.jsx'
import Closet from './routes/Closet.jsx'
import Community from './routes/Community.jsx'
import Profile from './routes/Profile.jsx'
import './styles.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'episodes', element: <Episodes /> },
      { path: 'closet', element: <Closet /> },
      { path: 'community', element: <Community /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
  { path: '/callback', element: <div>Signing you in…</div> } // app.js handles redirect
])

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)

