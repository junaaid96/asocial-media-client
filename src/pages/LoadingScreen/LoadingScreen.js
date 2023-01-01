import React from "react";
import ReactLoading from "react-loading";

const LoadingScreen = () => {
    return (
        <div className="flex flex-col items-center my-20">
            <ReactLoading type="spinningBubbles" />
            <p>Please Wait</p>
        </div>
    );
};

export default LoadingScreen;
