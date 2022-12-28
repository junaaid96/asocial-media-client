import React from "react";
import { Link } from "react-router-dom";
import signUpGif from "../../assets/gif/SignUp.gif";

const SignUp = () => {
    return (
        <div className="hero min-h-screen bg-base-200">
            <div className="hero-content flex-col-reverse lg:flex-row-reverse">
                <div className="text-center lg:text-left">
                    <img src={signUpGif} alt="login" />
                </div>
                <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
                    <div className="card-body">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Username</span>
                            </label>
                            <input
                                type="text"
                                placeholder="username"
                                className="input input-bordered"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Email</span>
                            </label>
                            <input
                                type="email"
                                placeholder="email"
                                className="input input-bordered"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input
                                type="password"
                                placeholder="password"
                                className="input input-bordered"
                            />
                            <label className="mt-3">
                                Already have an account? Please{" "}
                                <Link
                                    to="/login"
                                    className="font-bold text-primary"
                                >
                                    Login
                                </Link>
                            </label>
                        </div>
                        <div className="form-control mt-6">
                            <button className="btn btn-primary">Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
