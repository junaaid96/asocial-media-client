import Main from "../layout/Main";
import Home from "../pages/Home/Home";
import About from "../pages/About/About";
import ErrorPage from "../pages/ErrorPage/ErrorPage";
import Media from "../pages/Media/Media";
import Message from "../pages/Message/Message";
import Login from "../pages/Login/Login";
import SignUp from "../pages/SignUp/SignUp";
const { createBrowserRouter } = require("react-router-dom");

const router = createBrowserRouter([
    {
        path: "/",
        element: <Main />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/",
                element: <Home />,
            },
            {
                path: "/media",
                element: <Media />,
            },
            {
                path: "/message",
                element: <Message />,
            },
            {
                path: "/about",
                element: <About />,
            },
            {
                path: "/login",
                element: <Login />,

            },
            {
                path: "/signup",
                element: <SignUp />,
            }
        ],
    },
    {
        path: "/*",
        element: <ErrorPage />,
    },
]);

export default router;
