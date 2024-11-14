import React, { useState } from "react";
import {useParams} from "react-router-dom"
import InPageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import BlogPostCard from "../components/blog-post.component";
import NodDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
const SearchPage = () => {

    let {query} = useParams()
    let [blogs, SetBlogs] = useState(null)

    const searchBlogs = ({page =1, create_new_arr = false}) => {

        

    }

    return (
        <section className="h-cover flex justify-center gap-10">
            <div className="w-full">
                <InPageNavigation routes={[`Search Results from "${query}"`, "Accounts Matched"]} defaultHidden={["Accounts Matched"]}></InPageNavigation>

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
                    {/* <LoadMoreDataBtn state={blogs} fetchDataFun={(pageState == "home"?fetchLatestBLogs:fetchBlogByCategory)}></LoadMoreDataBtn> */}
                </>
            </div>
        </section>
    )
}

export default SearchPage;