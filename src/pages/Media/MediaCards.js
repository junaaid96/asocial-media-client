import React from "react";

const MediaCards = ({ post }) => {
    const { username, writings, photo } = post;
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
                <p>{writings}</p>
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
            </div>
        </div>
    );
};

export default MediaCards;
