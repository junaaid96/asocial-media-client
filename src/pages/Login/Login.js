import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import loginGif from "../../assets/gif/Login.gif";
import { FcGoogle } from "react-icons/fc";
import { GoogleAuthProvider } from "firebase/auth";
import { AuthContext } from "../../contexts/AuthProvider";

const Login = () => {
    const { providerLogin, existingUser } = useContext(AuthContext);
    const googleProvider = new GoogleAuthProvider();
    const [error, setError] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    const from = location.state?.from?.pathname || "/about";

    const handleLogin = (event) => {
        event.preventDefault();
        const form = event.target;
        const email = form.email.value;
        const password = form.password.value;
        existingUser(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log(user);
                setError("");
                navigate(from, { replace: true });
            })
            .catch((error) => {
                console.log(error.message);
                setError(error.message);
            });
    };

    const handleGoogleLogin = () => {
        providerLogin(googleProvider)
            .then((credential) => {
                const user = credential.user;
                console.log(user);
                const { displayName, email, photoURL } = user;
                const userData = {
                    username: displayName,
                    email,
                    institute: "",
                    address: "",
                    photo: photoURL,
                };
                fetch("https://asocial-media-server.onrender.com/users", {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(userData),
                });
                navigate(from, { replace: true });
            })
            .catch((error) => {
                console.log(error.message);
                setError(error.message);
            });
    };

    return (
        <div className="hero min-h-screen bg-base-200">
            <div className="hero-content flex-col-reverse lg:flex-row">
                <div className="text-center lg:text-left">
                    <img src={loginGif} alt="login" />
                </div>
                <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
                    <form className="card-body" onSubmit={handleLogin}>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Email</span>
                            </label>
                            <input
                                name="email"
                                type="email"
                                placeholder="email"
                                className="input input-bordered input-primary"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input
                                name="password"
                                type="password"
                                placeholder="password"
                                className="input input-bordered input-primary"
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
                        {error && (
                            <p className="text-white bg-red-600 rounded-lg p-2">
                                {error}
                            </p>
                        )}
                        <div className="form-control mt-6">
                            <button type="submit" className="btn btn-primary">
                                Login
                            </button>
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
