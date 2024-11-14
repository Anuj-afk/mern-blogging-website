import React, { useEffect, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation, { activeTabRef } from "../components/inpage-navigation.component";
import axios from "axios"
import Loader from "../components/loader.component"
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import NodDataMessage from "../components/nodata.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";

const HomePage = () => {
    let [blogs, setBlog] = useState(null)
    let [trendingBlogs, setTrendingBlog] = useState(null)
    let [pageState, setPageState] = useState("home")


    let categories = ["programming", "hollywood", "film making", "logo", "bus", "automation", "stock", "photo", "website", "insta", "hackathon"]

    const fetchLatestBLogs = ({page = 1}) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + '/latest-blogs', {page})
        .then(async ({data}) => {
            let formattedData = await filterPaginationData({
                state: blogs,
                data: data.blogs,
                page: page,
                countRoute: "/all-latest-blogs-count"
            })
            setBlog(formattedData)
        })
        .catch(err => {
            console.log(err);
        })
    }

    
    const fetchTrendingBLogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + '/trending-blogs')
        .then(({data}) => {
            setTrendingBlog(data.blogs)
        })
        .catch(err => {
            console.log(err);
        })
    }

    const loadBlogByCategory = (e) => {
        let category = e.target.innerText.toLowerCase();
        setBlog(null);
        if(pageState == category){
            setPageState("home");
            return;
        }
        setPageState(category);
    }

    const fetchBlogByCategory = ({page=1}) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + '/search-blogs', {tag: pageState, page})
        .then(async ({data}) => {
            let formattedData = await filterPaginationData({
                state: blogs,
                data: data.blogs,
                page: page,
                countRoute: "/search-blogs-count",
                data_to_send: { tag: pageState}
            })
            setBlog(formattedData)
        })
        .catch(err => {
            console.log(err);
        })
    }

    useEffect(() => {
        activeTabRef.current.click();
        if(pageState == "home"){
            fetchLatestBLogs({page: 1});
        }
        else{
            fetchBlogByCategory({page: 1});
        }
        if(!trendingBlogs){
            fetchTrendingBLogs();
        }

    }, [pageState])

    return(
        <AnimationWrapper>
            <section className="h-cover flex justify-center gap-10">
                {/* latest blogs */}
                <div className="w-full">
                    <InPageNavigation routes={[pageState, "trending blogs"]} defaultHidden={["trending blogs"]}>
                        
                        <>
                            {
                                blogs == null ? <Loader></Loader>:
                                blogs.results.length ?
                                blogs.results.map((blog, i) => {
                                    return  (
                                        <AnimationWrapper transition={{duration: 1, delay: i*0.1}} key={i}>
                                            <BlogPostCard content={blog} author={blog.author.personal_info}></BlogPostCard>
                                        </AnimationWrapper>
                                    )

                                })
                                :
                                <NodDataMessage message="No BLogs Published"></NodDataMessage>
                            }
                            <LoadMoreDataBtn state={blogs} fetchDataFun={(pageState == "home"?fetchLatestBLogs:fetchBlogByCategory)}></LoadMoreDataBtn>
                        </>
                        {
                            trendingBlogs == null ? <Loader></Loader>:
                            trendingBlogs.length?
                            trendingBlogs.map((blog, i) => {
                                return  (
                                    <AnimationWrapper transition={{duration: 1, delay: i*0.1}} key={i}>
                                        <MinimalBlogPost blog={blog} index={i}></MinimalBlogPost>
                                    </AnimationWrapper>
                                )

                            })
                            :
                            <NodDataMessage message="No Trending Blogs"></NodDataMessage>
                        }
                    </InPageNavigation>
                </div>
                {/* filters and trending blogs */}
                <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">

                    <div className="flex flex-col gap-10">
                        <div>
                            <h1 className="font-medium text-xl mb-8">Stories from all interests</h1>
                            <div className="flex gap-3 flex-wrap">
                                {
                                    categories.map((category, i) => {
                                        return (
                                            <button key={i} onClick={loadBlogByCategory} className={"tag" + (pageState == category? " bg-black text-white": " ")}>
                                                {category}
                                            </button>
                                    )})
                                }
                            </div>
                        </div>
                        <div>
                            <h1 className="font-medium text-xl mb-8">Trending <i className="fi fi-rr-arrow-trend-up"></i></h1>
                            {
                                trendingBlogs == null ? <Loader></Loader>:
                                trendingBlogs.length?
                                trendingBlogs.map((blog, i) => {
                                    return  (
                                        <AnimationWrapper transition={{duration: 1, delay: i*0.1}} key={i}>
                                            <MinimalBlogPost blog={blog} index={i}></MinimalBlogPost>
                                        </AnimationWrapper>
                                    )
    
                                })
                                :
                                <NodDataMessage message="No Trending Blogs"></NodDataMessage>
                            }
                        </div>
                    </div>
                    
                </div>
            </section>
        </AnimationWrapper>
    )
}

export default HomePage;