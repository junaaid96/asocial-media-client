import { useQuery } from "@tanstack/react-query";
import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthProvider";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

import Comments from "./Comments/Comments";

const AllMediaCard = ({ singlePost }) => {
    const { user } = useContext(AuthContext);
    const { _id, username, writings, photo } = singlePost;
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
            console.log(data);
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
        console.log(comment);
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
                <h2 className="card-title">{username}</h2>
                <p className="mb-10">{writings}</p>
                {user ? (
                    <div className="card-actions flex-col gap-6">
                        <div>
                            <button className="btn btn-outline btn-primary btn-sm">
                                Like
                            </button>
                        </div>
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
                                        placeholder="add a comment"
                                        className="input input-bordered w-full"
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
                    </div>
                ) : (
                    <div className="card-actions flex-col gap-6">
                        <p>
                            Please{" "}
                            <Link
                                to="/login"
                                className="font-bold text-primary"
                            >
                                login
                            </Link>{" "}
                            to add like and comment.
                        </p>
                    </div>
                )}
                {
                    //show comments
                    userComments.length > 0 ? (
                        <div className="mt-4">
                            <p>
                                0 Likes • {userComments.length}{" "}
                                {userComments.length === 1
                                    ? "comment"
                                    : "comments"}
                            </p>
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
                    ) : (
                        <div className="mt-4">
                            <p>0 Likes • {userComments.length} comments</p>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default AllMediaCard;
