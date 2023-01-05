import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthProvider";

const AllMediaCard = ({ singlePost }) => {
    const { user } = useContext(AuthContext);
    const { username, writings, photo } = singlePost;
    return (
        <div className="card h-fit bg-black shadow-xl">
            <figure>
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
                            <span className="indicator-item badge badge-ghost">
                                0
                            </span>
                        </div>
                        <div className="flex items-center gap-3 w-full">
                            <textarea
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="add a comment"
                            ></textarea>
                            <button className="btn btn-outline btn-primary btn-sm">
                                Post
                            </button>
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
            </div>
        </div>
    );
};

export default AllMediaCard;
