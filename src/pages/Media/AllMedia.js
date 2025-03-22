import { useQuery } from "@tanstack/react-query";
import React, { useContext } from "react";
import AllMediaCard from "./AllMediaCard";
import LoadingScreen from "../LoadingScreen/LoadingScreen";
import { AuthContext } from "../../contexts/AuthProvider";

const AllMedia = () => {
    const { user } = useContext(AuthContext);
    const {
        data: allPosts = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["allPosts"],
        queryFn: async () => {
            const res = await fetch(
                "https://asocial-media-server.vercel.app/posts"
            );
            const data = await res.json();
            return data;
        },
    });

    return (
        <>
            {isLoading && <LoadingScreen />}
            <div className="flex flex-col gap-6 m-6 lg:w-1/2 lg:m-auto lg:mb-6">
                {allPosts.map((singlePost) => (
                    <AllMediaCard
                        key={singlePost._id}
                        singlePost={singlePost}
                        user={user}
                        refetch={refetch}
                    ></AllMediaCard>
                ))}
            </div>
        </>
    );
};

export default AllMedia;
