import React, { useContext, useState } from "react";
import { toast } from "react-hot-toast";
import { RxCross1 } from "react-icons/rx";
import { FaEdit } from "react-icons/fa";
import { AuthContext } from "../../../contexts/AuthProvider";
import { formatDistanceToNow } from "date-fns";

const Comments = ({ userComment, refetch }) => {
    const { user } = useContext(AuthContext);
    const { _id, username, email, comment, createdAt, updatedAt } = userComment;
    const [isEditing, setIsEditing] = useState(false);
    const [editedComment, setEditedComment] = useState(comment);

    // Format the date
    const formattedDate = createdAt
        ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
        : "some time ago";

    // Delete comment
    const handleDeleteComment = () => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            fetch(`https://asocial-media-server.vercel.app/comment/${_id}`, {
                method: "DELETE",
            }).then((res) => {
                if (res.status === 200) {
                    refetch();
                    toast.success("Comment deleted successfully!");
                }
            });
        }
    };

    // Edit comment
    const handleEditComment = () => {
        setIsEditing(true);
    };

    // Save edited comment
    const handleSaveComment = () => {
        fetch(`https://asocial-media-server.vercel.app/comment/${_id}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ comment: editedComment }),
        }).then((res) => {
            if (res.status === 200) {
                setIsEditing(false);
                refetch();
                toast.success("Comment updated successfully!");
            }
        });
    };

    return (
        <div className="bg-gray-600 bg-opacity-50 p-3 rounded-r-lg flex flex-col">
            <div className="flex items-start justify-between">
                <div className="w-full">
                    <div className="flex items-center gap-2">
                        <p className="font-bold">{username}</p>
                    </div>

                    {isEditing ? (
                        <div className="mt-1 w-full">
                            <textarea
                                value={editedComment}
                                onChange={(e) =>
                                    setEditedComment(e.target.value)
                                }
                                className="w-full p-2 bg-gray-700 text-white rounded"
                                rows="2"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditedComment(comment);
                                    }}
                                    className="text-red-400 hover:text-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveComment}
                                    className="text-green-400"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p>{comment}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-sm text-gray-400">
                            {formattedDate}
                            {updatedAt && " (edited)"}
                        </span>
                    </div>
                </div>

                {email === user?.email && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleEditComment}
                            className="text-blue-400"
                        >
                            <FaEdit size={16} />
                        </button>
                        <button
                            onClick={handleDeleteComment}
                            className="text-red-400"
                        >
                            <RxCross1 size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Comments;
