import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
    return (
        <div className="hero h-fit bg-base-200 mb-6">
            <div className="hero-content text-center">
                <div className="max-w-md">
                    <h1 className="text-5xl font-bold">Welcome to aSocial</h1>
                    <p className="py-6">
                        A social media platform for introverts to write with
                        each other. You need to login for posting your thoughts.
                    </p>
                    <div className="flex gap-3 items-center justify-center">
                        <Link to="/login">
                            <button className="btn btn-primary">Login</button>
                        </Link>
                        <Link to="/login">
                            <button className="btn btn-primary">
                                Registration
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
