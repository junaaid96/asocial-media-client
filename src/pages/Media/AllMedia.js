import { useQuery } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import AllMediaCard from "./AllMediaCard";
import LoadingScreen from "../LoadingScreen/LoadingScreen";
import { AuthContext } from "../../contexts/AuthProvider";

const AllMedia = ({ onPageChange }) => {
    const { user } = useContext(AuthContext);
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage] = useState(3);

    const {
        data: response,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["allPosts", currentPage, postsPerPage],
        queryFn: async () => {
            // cache busting parameter to prevent browser caching
            const res = await fetch(
                `http://localhost:5000/posts?page=${currentPage}&limit=${postsPerPage}&t=${new Date().getTime()}`
            );
            if (!res.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await res.json();
            console.log(
                `Received ${data.posts.length} posts for page ${currentPage}`
            );
            return data;
        },
        keepPreviousData: false,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        cacheTime: 0, // Disable caching
    });

    // Extract posts and pagination info from response
    const allPosts = response?.posts || [];
    const totalPages = response?.totalPages || 1;

    // Change page
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Call the onPageChange callback if provided
        if (onPageChange) {
            onPageChange(pageNumber);
        }
    };

    return (
        <>
            {isLoading && <LoadingScreen />}
            <div className="flex flex-col gap-6 m-6 lg:w-1/2 lg:m-auto lg:mb-6">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">
                    Regular Posts
                </h2>
                {allPosts.map((singlePost) => (
                    <AllMediaCard
                        key={singlePost._id}
                        singlePost={singlePost}
                        user={user}
                        refetch={refetch}
                    ></AllMediaCard>
                ))}

                {/* Pagination */}
                {!isLoading && allPosts.length > 0 && (
                    <div className="flex justify-center mt-6">
                        <div className="btn-group">
                            <button
                                className="btn btn-sm"
                                onClick={() =>
                                    paginate(Math.max(currentPage - 1, 1))
                                }
                                disabled={currentPage === 1}
                            >
                                «
                            </button>

                            {[...Array(totalPages)].map((_, index) => (
                                <button
                                    key={index}
                                    className={`btn btn-sm ${
                                        currentPage === index + 1
                                            ? "btn-active"
                                            : ""
                                    }`}
                                    onClick={() => paginate(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            ))}

                            <button
                                className="btn btn-sm"
                                onClick={() =>
                                    paginate(
                                        Math.min(currentPage + 1, totalPages)
                                    )
                                }
                                disabled={currentPage === totalPages}
                            >
                                »
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AllMedia;
