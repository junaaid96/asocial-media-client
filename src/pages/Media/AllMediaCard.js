import React from "react";

const AllMediaCard = ({ singlePost }) => {
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
                <p>{writings}</p>
                <div className="card-actions flex-col gap-6">
                    <div className="indicator">
                        <span className="indicator-item badge badge-primary">
                            0
                        </span>
                        <button className="btn">Like</button>
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

export default AllMediaCard;
