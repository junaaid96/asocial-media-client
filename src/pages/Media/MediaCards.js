import { useQuery } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { BsThreeDots } from "react-icons/bs";
import { AuthContext } from "../../contexts/AuthProvider";
import LoadingScreen from "../LoadingScreen/LoadingScreen";
import Comments from "./Comments/Comments";
import LikeButton from "./Likes/LikeButton";
import { formatDistanceToNow } from "date-fns";

const MediaCards = ({ post, refetchPost }) => {
    const { user } = useContext(AuthContext);
    const { _id, username, writings, photo, createdAt, updatedAt } = post;
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedWritings, setEditedWritings] = useState(writings);

    // Format the date
    const formattedDate = createdAt
        ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
        : "some time ago";

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm();

    //get user's comments
    const {
        data: userComments = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["userComments", _id],
        queryFn: async () => {
            const res = await fetch(
                `https://asocial-media-server.vercel.app/comments/${_id}`
            );
            const data = await res.json();
            return data;
        },
    });

    if (isLoading) {
        <LoadingScreen />;
    }

    //add comment
    const handleAddComment = (data) => {
        const comment = {
            post_id: _id,
            username: user.displayName,
            email: user.email,
            comment: data.comment,
        };
        fetch("https://asocial-media-server.vercel.app/comments", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(comment),
        }).then((res) => {
            if (res.status === 200) {
                refetch();
                reset();
                toast.success("Comment added successfully!");
            }
        });
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setIsOpen(false);
    };

    const handleSaveEdit = () => {
        fetch(`https://asocial-media-server.vercel.app/post/${_id}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ writings: editedWritings }),
        }).then((res) => {
            if (res.status === 200) {
                setIsEditing(false);
                refetchPost();
                toast.success("Post updated successfully!");
            }
        });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedWritings(writings);
    };

    const handleDelete = () => {
        fetch(`https://asocial-media-server.vercel.app/post/${_id}`, {
            method: "DELETE",
        }).then((res) => {
            if (res.status === 200) {
                refetchPost();
                setIsOpen(false);
                toast.success("Post deleted successfully!");
            }
        });
    };

    return (
        <div className="card h-fit bg-black shadow-xl">
            <figure className="mt-12">
                <img
                    src={photo}
                    alt="post"
                    style={{ height: "28rem", width: "28rem" }}
                />
            </figure>
            <div className="card-body">
                <div className="flex justify-between items-center">
                    <h2 className="card-title">{username}</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                            {formattedDate}
                            {updatedAt && " (edited)"}
                        </span>
                        <div className="dropdown dropdown-end">
                            <label
                                tabIndex={0}
                                className="btn btn-ghost btn-circle"
                                onClick={toggleDropdown}
                            >
                                <BsThreeDots />
                            </label>
                            {isOpen && (
                                <ul
                                    tabIndex={0}
                                    className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                                >
                                    <li>
                                        <button onClick={handleEdit}>
                                            Edit
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={handleDelete}>
                                            Delete
                                        </button>
                                    </li>
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {isEditing ? (
                    <div className="mb-10">
                        <textarea
                            value={editedWritings}
                            onChange={(e) => setEditedWritings(e.target.value)}
                            className="w-full p-2 bg-gray-700 text-white rounded mb-2"
                            rows="4"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleCancelEdit}
                                className="btn btn-sm btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="btn btn-sm btn-primary"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="mb-10">{writings}</p>
                )}

                {/* Social interaction section */}
                <div className="border-t border-gray-700 pt-4">
                    {/* Like and comment count */}
                    <div className="flex items-center gap-2 mb-4">
                        <LikeButton
                            postId={_id}
                            user={user}
                            refetch={refetchPost}
                        />
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-400">
                            {userComments.length}{" "}
                            {userComments.length === 1 ? "comment" : "comments"}
                        </span>
                    </div>

                    {/* Comment form */}
                    <div className="w-full">
                        <form
                            className="flex gap-1 items-center"
                            onSubmit={handleSubmit(handleAddComment)}
                        >
                            <div className="w-full">
                                <input
                                    {...register("comment", {
                                        required: "Comment is Required",
                                    })}
                                    type="text"
                                    placeholder="Add a comment..."
                                    className="input input-bordered w-full bg-gray-800 text-white"
                                />
                                {errors.comment && (
                                    <p className="text-red-500">
                                        {errors.comment.message}
                                    </p>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                            >
                                Post
                            </button>
                        </form>
                    </div>

                    {/* Comments section */}
                    {userComments.length > 0 && (
                        <div className="mt-4">
                            <div className="h-fit w-full rounded-lg p-3 mt-2 bg-gray-800 bg-opacity-50 flex flex-col gap-3">
                                {userComments.map((userComment) => (
                                    <Comments
                                        key={userComment._id}
                                        userComment={userComment}
                                        refetch={refetch}
                                    ></Comments>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaCards;
