import React, { useContext, useState } from "react";
import { AuthContext } from "../../contexts/AuthProvider";
import AllMedia from "../Media/AllMedia";
import Writings from "../Writings/Writings";
import Header from "./Header/Header";
import PopularPosts from "./PopularPosts/PopularPosts";

const Home = () => {
    const { user } = useContext(AuthContext);
    // Always start with collapsed state (false)
    const [isPopularPostsExpanded, setIsPopularPostsExpanded] = useState(false);

    return (
        <div className="container mx-auto px-4">
            {user ? (
                <>
                    <Writings />
                </>
            ) : (
                <>
                    <Header />
                </>
            )}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-3/4">
                    {/* PopularPosts appears above AllMedia on mobile/tablet */}
                    <div className="block lg:hidden mb-6">
                        <PopularPosts
                            isExpanded={isPopularPostsExpanded}
                            setIsExpanded={setIsPopularPostsExpanded}
                        />
                    </div>
                    <AllMedia
                        onPageChange={() => {
                            // Collapse popular posts when page changes
                            setIsPopularPostsExpanded(false);
                        }}
                    />
                </div>
                {/* PopularPosts appears as sidebar on lg screens and above */}
                <div className="hidden lg:block lg:w-1/4 mt-6">
                    <PopularPosts
                        isExpanded={isPopularPostsExpanded}
                        setIsExpanded={setIsPopularPostsExpanded}
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
