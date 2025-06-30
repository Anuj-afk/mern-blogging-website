import React, { useContext } from "react";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";
import axios from "axios";
import { UserContext } from "../App";
import { useNavigate, useParams } from "react-router-dom";

const PublishForm = () => {
    let {
        blog,
        blog: { banner, title, tags, des, content },
        setEditorState,
        setBlog,
    } = useContext(EditorContext);
    let {
        userAuth: { access_token },
    } = useContext(UserContext);
    let { blog_id } = useParams();

    let characterLimit = 200;
    let navigate = useNavigate();
    let tagLimit = 10;
    const handleCloseEvent = () => {
        setEditorState("editor");
    };
    const handleBlogTitleChange = (e) => {
        const updatedTitle = e.target.value;
        title = updatedTitle;
        setBlog((prevBlog) => ({
            ...prevBlog,
            title: updatedTitle, // Update the title
        }));
        console.log(blog)
    };

    const handleBlogDesChange = (e) => {
        setBlog({ ...blog, des: e.target.value });
    };

    const handleTitleKeyDown = (e) => {
        if (e.keyCode == 13) {
            e.preventDefault();
        }
    };

    const handleKeyDown = (e) => {
        if (e.keyCode == 13 || e.keyCode == 188) {
            e.preventDefault();
            let tag = e.target.value.trim();
            if (tags.length < tagLimit) {
                if (!tags.includes(tag) && tag.length) {
                    setBlog({ ...blog, tags: [...tags, tag] });
                }
            } else {
                toast.error(`you can add maximum ${tagLimit} tags`);
            }
            e.target.value = "";
        }
    };

    const publishBlog = (e) => {
        if (e.target.className.includes("disable")) {
            return;
        }
        if (!banner.length) {
            return toast.error("Upload a blog banner to publish it");
        }
        if (!title.length) {
            return toast.error("Add a title to publish it");
        }
        if (!des.length || des.length > characterLimit) {
            return toast.error(
                `Add a description to publish it, within ${characterLimit} characters`
            );
        }
        if (!tags.length || tags.length > tagLimit) {
            return toast.error(
                `Add at least one tag to publish it, Maximum ${tagLimit} tags`
            );
        }

        let loadingToast = toast.loading("Publishing....");
        e.target.classList.add("disable");

        let blogObj = {
            title,
            banner,
            des,
            content,
            tags,
            draft: false,
        };
        axios
            .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/create-blog",
                { ...blogObj, id: blog_id },
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                }
            )
            .then(() => {
                toast.dismiss(loadingToast);
                toast.success("Blog published successfully");
                e.target.classList.remove("disable");
                setTimeout(() => {
                    navigate("/");
                }, 500);
            })
            .catch(({ response }) => {
                toast.dismiss(loadingToast);
                toast.error("Failed to publish blog");
                e.target.classList.remove("disable");
                console.log(response.data.error);
            });
    };

    return (
        <AnimationWrapper>
            <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-16">
                <Toaster></Toaster>
                <button
                    className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
                    onClick={handleCloseEvent}
                >
                    <i className="fi fi-br-cross"></i>
                </button>
                <div className="max-w-[550px] center">
                    <p className="text-dark-grey mb-1">Preview</p>

                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
                        <img src={banner} alt="" />
                    </div>
                    <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">
                        {title}
                    </h1>
                    <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">
                        {des}
                    </p>
                </div>

                <div className="border-grey lg:border-1 lg:pl-8">
                    <p className="text-dark-grey mb-2 mt-9">Blog Title</p>
                    <input
                        className="input-box pl-4"
                        type="text"
                        placeholder="Blog Title"
                        defaultValue={title}
                        onChange={handleBlogTitleChange}
                    />

                    <p className="text-dark-grey mb-2 mt-9">
                        Short Description about your blog
                    </p>
                    <textarea
                        name=""
                        id=""
                        maxLength={characterLimit}
                        defaultValue={des}
                        className="h-40 resize-none leading-7 input-box pl-4"
                        onChange={handleBlogDesChange}
                        onKeyDown={handleTitleKeyDown}
                    ></textarea>
                    <p className="mt-1 text-dark-grey text-sm text-right">
                        {characterLimit - des.length} characters left
                    </p>

                    <p>
                        Topics - (Helps in searching and ranking your blog post)
                    </p>
                    <div className="relative input-box pl-2 py-2 pb-4">
                        <input
                            type="text"
                            placeholder="Topics"
                            className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white"
                            onKeyDown={handleKeyDown}
                        />

                        {tags.map((tag, index) => (
                            <Tag key={index} tagIndex={index} tag={tag}></Tag>
                        ))}
                    </div>
                    <p className="mt-1 mb-4 text-dark-grey text-right">
                        {tagLimit - tags.length} Tags left
                    </p>

                    <button className="btn-dark px-8" onClick={publishBlog}>
                        Publish
                    </button>
                </div>
            </section>
        </AnimationWrapper>
    );
};

export default PublishForm;
