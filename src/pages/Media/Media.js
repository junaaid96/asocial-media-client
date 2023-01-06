import { useQuery } from "@tanstack/react-query";
import React, { useContext } from "react";
import { AuthContext } from "../../contexts/AuthProvider";
import LoadingScreen from "../LoadingScreen/LoadingScreen";
import MediaCards from "./MediaCards";

const Media = () => {
    const { user } = useContext(AuthContext);
    const {
        data: userPosts = [],
        isLoading,
        refetch,
    } = useQuery({
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
            <h2 className="text-3xl font-bold text-center mb-6">
                Your all posts
            </h2>
            {userPosts.length > 0 ? (
                <div className="flex flex-col gap-6 m-6 lg:w-1/2 lg:m-auto lg:mb-6">
                    {userPosts.map((post) => (
                        <MediaCards
                            key={post._id}
                            post={post}
                            refetchPost={refetch}
                        ></MediaCards>
                    ))}
                </div>
            ) : (
                <p className="text-xl text-center mb-6">
                    You didn't post anything yet!
                </p>
            )}
        </>
    );
};

export default Media;
