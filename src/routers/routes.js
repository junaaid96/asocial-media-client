import Main from "../layout/Main";
import Home from "../pages/Home/Home";
import About from "../pages/About/About";
import ErrorPage from "../pages/ErrorPage/ErrorPage";
import Media from "../pages/Media/Media";
import Message from "../pages/Message/Message";
import Login from "../pages/Login/Login";
import SignUp from "../pages/SignUp/SignUp";
import PrivateRoutes from "./PrivateRoutes/PrivateRoutes";
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
                element: (
                    <PrivateRoutes>
                        <Media />
                    </PrivateRoutes>
                ),
            },
            {
                path: "/message",
                element: (
                    <PrivateRoutes>
                        <Message />
                    </PrivateRoutes>
                ),
            },
            {
                path: "/about",
                element: (
                    <PrivateRoutes>
                        <About />
                    </PrivateRoutes>
                ),
            },
            {
                path: "/login",
                element: <Login />,
            },
            {
                path: "/signup",
                element: <SignUp />,
            },
        ],
    },
    {
        path: "/*",
        element: <ErrorPage />,
    },
]);

export default router;
