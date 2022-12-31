import { useQuery } from "@tanstack/react-query";
import React, { useContext } from "react";
import { AuthContext } from "../../contexts/AuthProvider";
import LoadingScreen from "../LoadingScreen/LoadingScreen";
import MediaCards from "./MediaCards";

const Media = () => {
    const { user } = useContext(AuthContext);
    const { data: userPosts = [], isLoading } = useQuery({
        queryKey: ["userPosts", user?.email],
        queryFn: async () => {
            const res = await fetch(
                `https://asocial-media-server.onrender.com/posts/${user?.email}`
            );
            const data = await res.json();
            console.log(data);
            return data;
        },
    });

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>
            <h2 className="text-2xl text-center mb-6">All Posts</h2>
            <div className="flex flex-col gap-3 w-1/2 m-auto">
                {userPosts.map((post) => (
                    <MediaCards key={post.key} post={post}></MediaCards>
                ))}
            </div>
        </>
    );
};

export default Media;
