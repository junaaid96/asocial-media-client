import { type ReactNode, Suspense, lazy } from "react";
import { Navigate, createBrowserRouter, useLocation } from "react-router";
import { AppShell } from "./components/AppShell";
import { PageSpinner } from "./components/ui/Spinner";
import { useAuth } from "./lib/auth";
import { Home } from "./pages/Home";
import { NotFound, RouteError } from "./pages/NotFound";

// Everything except the home feed is loaded on demand.
const Login = lazy(() => import("./pages/Auth").then((m) => ({ default: m.Login })));
const Join = lazy(() => import("./pages/Auth").then((m) => ({ default: m.Join })));
const Explore = lazy(() => import("./pages/Explore").then((m) => ({ default: m.Explore })));
const LetterView = lazy(() => import("./pages/LetterView").then((m) => ({ default: m.LetterView })));
const Letters = lazy(() => import("./pages/Letters").then((m) => ({ default: m.Letters })));
const Notifications = lazy(() => import("./pages/Notifications").then((m) => ({ default: m.Notifications })));
const PostDetail = lazy(() => import("./pages/PostDetail").then((m) => ({ default: m.PostDetail })));
const Profile = lazy(() => import("./pages/Profile").then((m) => ({ default: m.Profile })));
const Saved = lazy(() => import("./pages/Saved").then((m) => ({ default: m.Saved })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const Messages = lazy(() => import("./pages/Messages").then((m) => ({ default: m.Messages })));
const Admin = lazy(() => import("./pages/Admin").then((m) => ({ default: m.Admin })));
const Tag = lazy(() => import("./pages/Tag").then((m) => ({ default: m.Tag })));
const PromptAnswers = lazy(() => import("./pages/PromptAnswers").then((m) => ({ default: m.PromptAnswers })));

const page = (node: ReactNode) => <Suspense fallback={<PageSpinner />}>{node}</Suspense>;

function RequireAuth({ children }: { children: ReactNode }) {
  const { me, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  if (!me) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { me, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (me?.role !== "admin") return <NotFound />;
  return children;
}

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: "/login", element: page(<Login />) },
      { path: "/join", element: page(<Join />) },
      { path: "/signup", element: <Navigate to="/join" replace /> },
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Home /> },
          { path: "explore", element: page(<Explore />) },
          { path: "post/:id", element: page(<PostDetail />) },
          { path: "u/:username", element: page(<Profile />) },
          { path: "letters", element: page(<RequireAuth><Letters /></RequireAuth>) },
          { path: "letters/:id", element: page(<RequireAuth><LetterView /></RequireAuth>) },
          { path: "notifications", element: page(<RequireAuth><Notifications /></RequireAuth>) },
          { path: "saved", element: page(<RequireAuth><Saved /></RequireAuth>) },
          { path: "settings", element: page(<RequireAuth><Settings /></RequireAuth>) },
          { path: "messages", element: page(<RequireAuth><Messages /></RequireAuth>) },
          { path: "messages/:id", element: page(<RequireAuth><Messages /></RequireAuth>) },
          { path: "tag/:tag", element: page(<Tag />) },
          { path: "prompt/:date", element: page(<PromptAnswers />) },
          { path: "admin", element: page(<RequireAuth><RequireAdmin><Admin /></RequireAdmin></RequireAuth>) },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);
