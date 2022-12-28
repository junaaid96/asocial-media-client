import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
    return (
        <div className="hero min-h-screen bg-base-200">
            <div className="hero-content text-center">
                <div className="max-w-md">
                    <h1 className="text-5xl font-bold">Welcome to aSocial</h1>
                    <p className="py-6">
                        A social media platform for introverts to write with
                        each other.
                    </p>
                    <Link to="/about">
                        <button className="btn btn-primary">Get Started</button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Header;
