import React from "react";

const MediaCards = ({ post }) => {
    const { username, writings, photo } = post;
    return (
        <div className="card lg:card-side bg-base-100 shadow-xl">
            <figure>
                <img src={photo} alt="post" style={{height: "20rem", width: "20rem"}}/>
            </figure>
            <div className="card-body">
                <h2 className="card-title">{username}</h2>
                <p>{writings}</p>
                <div className="card-actions justify-end">
                    <button className="btn btn-primary">Delete</button>
                </div>
            </div>
        </div>
    );
};

export default MediaCards;
