import React from "react";
import { Link } from "react-router-dom";
import errorGif from "../../assets/gif/Error.gif";

const ErrorPage = () => {
    return (
        <div className="flex flex-col justify-center items-center">
            <div>
                <img src={errorGif} alt="error" />
            </div>
            <div>
                <Link to="/">
                    <button className="btn btn-primary">Go to Home</button>
                </Link>
            </div>
        </div>
    );
};

export default ErrorPage;
