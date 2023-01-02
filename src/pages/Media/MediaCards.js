import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { BsThreeDotsVertical } from "react-icons/bs";

const MediaCards = ({ post, refetch }) => {
    const { _id, username, writings, photo } = post;
    const [isOpen, setIsOpen] = useState(false);
    // const [editedWritings, setEditedWritings] = useState(writings);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // const handleEdit = () => {
    //     fetch(`https://asocial-media-server.onrender.com/post/${_id}`, {
    //         method: "PATCH",
    //         headers: {
    //             "content-type": "application/json",
    //         },
    //         body: JSON.stringify({ writings: editedWritings }),
    //     }).then((res) => {
    //         if (res.status === 200) {
    //             refetch();
    //             setIsOpen(false);
    //             toast.success("Post edited successfully!");
    //         }
    //     });
    // };

    const handleDelete = () => {
        fetch(`https://asocial-media-server.onrender.com/post/${_id}`, {
            method: "DELETE",
        }).then((res) => {
            if (res.status === 200) {
                refetch();
                setIsOpen(false);
                toast.success("Post deleted successfully!");
            }
        });
    };

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
                    <div className="dropdown dropdown-end absolute top-0 right-0">
                        <label
                            tabIndex={0}
                            className="btn btn-ghost"
                            onClick={toggleDropdown}
                        >
                            <BsThreeDotsVertical size={25} />
                        </label>
                        <ul
                            tabIndex={0}
                            className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                            style={{ display: isOpen ? "block" : "none" }}
                        >
                            <li>
                                <button>Edit</button>
                            </li>
                            <li>
                                <button onClick={handleDelete}>Delete</button>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <button className="btn btn-outline btn-primary btn-sm">
                            Like
                        </button>
                        <span className="indicator-item badge badge-ghost">
                            0
                        </span>
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

export default MediaCards;
