import { useQuery } from "@tanstack/react-query";
import React from "react";
import AllMediaCard from "./AllMediaCard";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

const AllMedia = () => {
    const { data: allPosts = [], isLoading } = useQuery({
        queryKey: "allPosts",
        queryFn: async () => {
            const res = await fetch(
                "https://asocial-media-server.onrender.com/posts"
            );
            const data = await res.json();
            return data;
        },
    });

    if (isLoading) {
        <LoadingScreen />;
    }

    return (
        <div className="flex flex-col gap-3 w-1/2 m-auto">
            {allPosts.map((singlePost) => (
                <AllMediaCard
                    key={singlePost.key}
                    singlePost={singlePost}
                ></AllMediaCard>
            ))}
        </div>
    );
};

export default AllMedia;
