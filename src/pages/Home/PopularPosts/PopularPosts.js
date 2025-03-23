import React from "react";
import { useQuery } from "@tanstack/react-query";
import MediaCards from "../../Media/MediaCards";
import ReactLoading from "react-loading";

const PopularPosts = ({ isExpanded, setIsExpanded }) => {
    const {
        data: popularPosts = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["popularPosts"],
        queryFn: async () => {
            const res = await fetch(
                "http://localhost:5000/posts/popular"
            );
            const data = await res.json();
            return data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center my-6">
                <ReactLoading
                    type={"spinningBubbles"}
                    color={"#F0C000"}
                    height={60}
                    width={60}
                />
            </div>
        );
    }

    return (
        <div className="bg-base-100 p-4 rounded-lg shadow-md w-full">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-bold">
                    Popular Posts
                </h2>
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    {isExpanded ? '▲ Collapse' : '▼ Expand'}
                </button>
            </div>
            
            {isExpanded && (
                popularPosts.length === 0 ? (
                    <p className="text-center text-sm">No popular posts found</p>
                ) : (
                    <div className="space-y-4 md:grid md:grid-cols-2 lg:flex lg:flex-col md:gap-4 md:space-y-0">
                        {popularPosts.map((post) => (
                            <MediaCards
                                key={post._id}
                                post={post}
                                refetch={refetch}
                                sidebar={true}
                            />
                        ))}
                    </div>
                )
            )}
            
            {!isExpanded && popularPosts.length > 0 && (
                <p className="text-center text-sm text-gray-500">Click expand to view popular posts</p>
            )}
        </div>
    );
};

export default PopularPosts;
