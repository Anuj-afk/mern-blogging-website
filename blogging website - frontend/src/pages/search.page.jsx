import React, { useEffect, useState } from "react";
import {useParams} from "react-router-dom"
import InPageNavigation, { activeTabRef } from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import BlogPostCard from "../components/blog-post.component";
import NodDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import axios from "axios";
import UserCard from "../components/usercard.component";
const SearchPage = () => {

    let {query} = useParams()
    let [blogs, setBlog] = useState(null)
    let [users, setUsers] = useState(null)

    const searchBlogs = ({page =1, create_new_arr = false}) => {

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {query, page})
        .then(async ({data}) => {
            let formattedData = await filterPaginationData({
                state: blogs,
                data: data.blogs,
                page: page,
                countRoute: "/search-blogs-count",
                data_to_send: {query},
                create_new_arr: create_new_arr,
            })
            setBlog(formattedData)
        })
        .catch(err => {
            console.log(err);
        })
    }

    const fetchUsers = () => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-users", {query})
        .then(({data: {users}}) => {
            setUsers(users)
        })
    }

    useEffect(() => {
        activeTabRef.current.click()
        resetState();
        searchBlogs({page: 1, create_new_arr: true});
        fetchUsers();
    }, [query])

    const resetState = () => {
        setBlog(null);
        setUsers(null);
    }

    const UserCardWrapper = () => {
        return(
            <>
                {
                    users == null ? <Loader></Loader>:
                    users.length ?
                    users.map((user, i) => {
                    return  (
                        <AnimationWrapper transition={{duration: 1, delay: i*0.08}} key={i}>
                            <UserCard user={user}></UserCard>
                        </AnimationWrapper>
                    )

                    })
                    :
                    <NodDataMessage message="No BLogs Published"></NodDataMessage>
                }
            </>
        )
    }

    return (
        <section className="h-cover flex justify-center gap-10">
            <div className="w-full">
                <InPageNavigation routes={[`Search Results from "${query}"`, "Accounts Matched"]} defaultHidden={["Accounts Matched"]}>
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
                    </>
                    <UserCardWrapper></UserCardWrapper>
                </InPageNavigation>
            </div>
            <div className="min-w-[40%] lg:min-w-[350px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
                <h1 className="font-medium text-xl mb-8">User related to Search <i className="fi fi-rr-user mt-1"></i></h1>
                <UserCardWrapper></UserCardWrapper>
            </div>
        </section>
    )
}

export default SearchPage;