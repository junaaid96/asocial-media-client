import Main from "../layout/Main";
import Home from "../pages/Home/Home";
import About from "../pages/About/About";
import ErrorPage from "../pages/ErrorPage/ErrorPage";
import Media from "../pages/Media/Media";
import Message from "../pages/Message/Message";
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
        ],
    },
    {
        path: "/*",
        element: <ErrorPage />,
    },
]);

export default router;
