import React from "react";

const MediaModal = ({
    isOpen: isModalOpen,
    toggleDropdown,
    editedWritings,
    handleChange,
    handleEdit,
}) => {
    return (
        <div className={`modal ${isModalOpen ? "block" : "hidden"}`}>
            <div className="modal-overlay w-full h-full fixed top-0 left-0 flex items-center justify-center">
                <div className="modal-container bg-white rounded-md shadow-md w-11/12 md:w-1/2 xl:w-1/3 p-6">
                    <div className="modal-header flex justify-between items-center pb-3">
                        <h2 className="text-2xl font-bold">Edit Post</h2>
                        <button
                            type="button"
                            className="modal-close-button"
                            onClick={toggleDropdown}
                        >
                            <span className="sr-only">Close</span>
                            <span className="modal-close-icon">&times;</span>
                        </button>
                    </div>
                    <form>
                        <div className="modal-body pb-6">
                            <div className="form-group">
                                <label
                                    className="form-label"
                                    htmlFor="writings"
                                >
                                    Writings
                                </label>
                                <textarea
                                    className="form-control"
                                    id="writings"
                                    name="writings"
                                    rows="4"
                                    value={editedWritings}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="modal-footer flex justify-end items-center pb-4 pt-3">
                            <button
                                type="button"
                                className="btn btn-secondary mr-3"
                                onClick={toggleDropdown}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleEdit}
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MediaModal;
