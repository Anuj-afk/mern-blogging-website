import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { getDay } from "../common/date";
import BlogInteraction from "../components/blog-interaction.component";
import BlogPostCard from "../components/blog-post.component";
import BlogContent from "../components/blog-content.component";

export const blogStructure = {
    title: "",
    des: "",
    content: [],
    tags: [],
    author: {
        personal_info: {}
    },
    banner: " ",
    publishedAt: "",
}

export const BlogContext = createContext()

const BlogPage  = () => {

    let {blog_id} = useParams()

    const [blog, setBlog] = useState(blogStructure);
    const [similarBlogs, setSimilarBlogs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [islikedByUser, setLikeByUser] = useState(false);

    let {title, content, tags, banner, author: {personal_info: {fullname, username: author_username, profile_img}}, publishedAt} = blog;

    const fetchBLog = () => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blog", {blog_id})
        .then(({data: {blog}}) => {
            console.log(blog.content);
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {tag: blog.tags[0], limit: 6, eliminate_blog: blog_id})
            .then(({data}) => {
                setSimilarBlogs(data.blogs);
            })
            setBlog(blog);
            setLoading(false);
        })
        .catch(err => {
            console.log(err);
            setLoading(false);
        })
    }

    useEffect(() => {
        resetStates();
        fetchBLog();
    }, [blog_id])

    const resetStates = () => {
        setBlog(blogStructure);
        setSimilarBlogs(null);
        setLoading(true); 
    }

    return (
        <div>
            <AnimationWrapper>
                {
                    loading ? <Loader></Loader>
                    :
                    <BlogContext.Provider value={{blog, setBlog, islikedByUser, setLikeByUser}}>
                        <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">

                            <img src={banner} className="aspect-video" />

                            <div className="mt-12">
                                <h2>{title}</h2>

                                <div className="flex max-sm:flex-col justify-between my-8">
                                    <div className="flex gap-5 items-start">
                                        <img src={profile_img} className="w-12 h-12 rounded-full" />
                                        <p className="capitalize">
                                            {fullname}
                                            <br />
                                            @
                                            <Link to={`/user/${author_username}`} className="underline">{author_username}</Link>
                                        </p>
                                    </div>
                                    <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">Published on {getDay(publishedAt)}</p>
                                </div>
                            </div>

                            <BlogInteraction></BlogInteraction>

                            <div className="my-12 font-gelasio blog-page-content">
                            {
                                content[0].blocks.map((block, i) => {
                                    return(
                                        <div key={i} className="my-4 md:my-8">
                                            <BlogContent block={block}></BlogContent>
                                        </div>
                                    )
                                })
                            }
                            </div>

                            <BlogInteraction></BlogInteraction>

                            {
                                similarBlogs?.length ? 
                                <>
                                    <h1 className="text-2xl mt-14 mb-10 font-medium">Similar Blogs</h1>
                                    {
                                        similarBlogs.map((blog, i) => {
                                            let {author: {personal_info}} = blog;
                                            return(
                                                <AnimationWrapper key={i} transition={{duration: 1, delay: i*0.08}}>
                                                    <BlogPostCard content={blog} author={personal_info}></BlogPostCard>
                                                </AnimationWrapper>
                                            ) 

                                        })
                                    }
                                </>
                                :
                                ""
                            }

                        </div>
                    </BlogContext.Provider>   
                }
            </AnimationWrapper>
        </div>
    )
}

export default BlogPage;