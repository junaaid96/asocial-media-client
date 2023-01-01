import React from "react";
import ReactLoading from "react-loading";

const CreatingPost = () => {
    return (
        <div className="flex flex-col items-center my-20">
            <ReactLoading type="cubes" />
            <p>Creating Post</p>
        </div>
    );
};

export default CreatingPost;
