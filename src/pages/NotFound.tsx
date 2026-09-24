import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "../components/ui/Button";

export function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md px-6 py-12 text-center">
      <p className="text-5xl" aria-hidden>
        🍃
      </p>
      <h1 className="mt-4 font-serif text-2xl font-semibold">This page wandered off</h1>
      <p className="mt-2 text-muted">It might have been moved, or it never existed. Either way, no harm done.</p>
      <Link to="/" className="mt-6 inline-block">
        <Button>Return home</Button>
      </Link>
    </div>
  );
}

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? error.statusText : error instanceof Error ? error.message : "Unknown error";
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="text-5xl" aria-hidden>
          🌧️
        </p>
        <h1 className="mt-4 font-serif text-2xl font-semibold">Something went quietly wrong</h1>
        <p className="mt-2 text-muted">{message}</p>
        <Button className="mt-6" onClick={() => location.assign("/")}>
          Start fresh
        </Button>
      </div>
    </div>
  );
}
