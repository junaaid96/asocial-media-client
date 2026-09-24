import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Button } from "./ui/Button";

export function FollowButton({ username, following, size = "md" }: { username: string; following: boolean; size?: "sm" | "md" }) {
  const { me } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [state, setState] = useState(following);

  const toggle = useMutation({
    mutationFn: (next: boolean) => api(`/users/${username}/follow`, { method: next ? "POST" : "DELETE" }),
    onMutate: (next) => setState(next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      queryClient.invalidateQueries({ queryKey: ["posts", "feed", "following"] });
    },
    onError: (error, next) => {
      setState(!next);
      toast.error(errorMessage(error));
    },
  });

  if (me?.username === username) return null;
  return (
    <Button
      size={size}
      variant={state ? "secondary" : "primary"}
      onClick={() => (me ? toggle.mutate(!state) : navigate("/login"))}
      aria-pressed={state}
    >
      {state ? "Following" : "Follow"}
    </Button>
  );
}
