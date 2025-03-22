import React, { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import toast from "react-hot-toast";

const LikeButton = ({ postId, user, refetch }) => {
    const [liked, setLiked] = useState(false);
    const [likeId, setLikeId] = useState(null);
    const [likesCount, setLikesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Check if the user has already liked the post
    useEffect(() => {
        if (user) {
            setLoading(true);
            fetch(`http://localhost:5000/likes/${postId}/${user.email}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.liked) {
                        setLiked(true);
                        setLikeId(data._id);
                    } else {
                        setLiked(false);
                        setLikeId(null);
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [postId, user]);

    // Get the total likes count for this post
    useEffect(() => {
        fetch(`http://localhost:5000/likes/count/${postId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.count !== undefined) {
                    setLikesCount(data.count);
                }
            })
            .catch((err) => console.error(err));
    }, [postId, liked]);

    const handleLike = () => {
        if (!user) {
            toast.error("Please login to like posts");
            return;
        }

        if (liked) {
            // Unlike the post
            fetch(`http://localhost:5000/like/${likeId}`, {
                method: "DELETE",
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.message === "Like removed") {
                        setLiked(false);
                        setLikeId(null);
                        refetch();
                    }
                })
                .catch((err) => console.error(err));
        } else {
            // Like the post
            const likeData = {
                post_id: postId,
                email: user.email,
            };

            fetch("http://localhost:5000/likes", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(likeData),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.message === "Like added") {
                        setLiked(true);
                        // Get the new like ID
                        fetch(
                            `http://localhost:5000/likes/${postId}/${user.email}`
                        )
                            .then((res) => res.json())
                            .then((likeData) => {
                                if (likeData.liked) {
                                    setLikeId(likeData._id);
                                }
                                refetch();
                            });
                    }
                })
                .catch((err) => console.error(err));
        }
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={handleLike}
                disabled={loading}
                className="flex items-center gap-1 text-red-500"
            >
                {liked ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
                <span>{likesCount}</span>
            </button>
        </div>
    );
};

export default LikeButton;
