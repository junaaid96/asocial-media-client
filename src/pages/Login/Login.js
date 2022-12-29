import React, { useContext } from "react";
import { Link } from "react-router-dom";
import loginGif from "../../assets/gif/Login.gif";
import { FcGoogle } from "react-icons/fc";
import { GoogleAuthProvider } from "firebase/auth";
import { AuthContext } from "../../contexts/AuthProvider";

const Login = () => {
    const { providerLogin } = useContext(AuthContext);
    const googleProvider = new GoogleAuthProvider();

    const handleGoogleLogin = () => {
        providerLogin(googleProvider)
            .then((credential) => {
                const user = credential.user;
                console.log(user);
            })
            .catch((error) => {
                console.log(error.message);
            });
    };

    return (
        <div className="hero min-h-screen bg-base-200">
            <div className="hero-content flex-col-reverse lg:flex-row">
                <div className="text-center lg:text-left">
                    <img src={loginGif} alt="login" />
                </div>
                <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
                    <form className="card-body">
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
                            <label className="label">
                                <Link
                                    href="#"
                                    className="label-text-alt link link-hover"
                                >
                                    Forgot password?
                                </Link>
                            </label>
                            <label className="mt-3">
                                New here? Please{" "}
                                <Link
                                    to="/signup"
                                    className="font-bold text-primary"
                                >
                                    Sign Up
                                </Link>
                            </label>
                        </div>
                        <div className="form-control mt-6">
                            <button className="btn btn-primary">Login</button>
                        </div>
                    </form>
                    <div className="divider"></div>
                    <button
                        className="btn btn-block btn-outline gap-2"
                        onClick={handleGoogleLogin}
                    >
                        <FcGoogle size={25} />
                        <p>Login with Google</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
