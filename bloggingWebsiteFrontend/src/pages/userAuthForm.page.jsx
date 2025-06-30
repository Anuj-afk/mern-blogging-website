import React, { useContext } from "react";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png"
import { Link, Navigate } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { useRef } from "react";
import {Toaster, toast} from "react-hot-toast"
import axios from "axios"
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";


const UserAuthForm = ({type}) => {

    let {userAuth: {access_token}, setUserAuth} = useContext(UserContext)

    console.log(access_token)

    const userAuthThroughServer = (serverRoute, formData) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData)
        .then(({data}) => {
            storeInSession("user", JSON.stringify(data));
            setUserAuth(data);
        })
        .catch(({response}) => {
            toast.error(response.data.error)
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        let serverRoute = type == "sign-in"?"/signin":"/signup";

        let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
        let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

        let form = new FormData(authForm);
        let formData = {};
        for(let [key, value] of form.entries()){
            formData[key] = value;
        }
        let {fullname, email, password} = formData;

        if(fullname){
            if(fullname.length < 3){
                return toast.error("Fullname must be at least 3 characters long");
            }
        }

        if(!email.length){
            return toast.error("Enter Email")
        }
        if(!emailRegex.test(email)){
            return toast.error("Email is invalid");
        }
        if(!passwordRegex.test(password)){
            return toast.error("Password should contain at least one uppercase letter, one lowercase letter,number and be at least 6 characters long");
        }
    
        userAuthThroughServer(serverRoute, formData)

    }

    const handleGoogleAuth = (e) => {
        e.preventDefault();
        authWithGoogle().then(user => {
            let serverRoute = '/google-auth';
            let formData = {access_token: user.accessToken};
            userAuthThroughServer(serverRoute, formData);
        })
        .catch(err => {
            toast.error("Trouble login through Google");
            return console.log(err);
        })
    }

    return(
        access_token ? 
        <Navigate to="/"></Navigate>
        :
        <AnimationWrapper keyValue={type}>
            <section className="h-cover flex items-center justify-center">
                <Toaster></Toaster>
                <form className="w-[80%] max-w-[400px]" id="authForm">
                    <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
                        {type == "sign-in" ? "Welcome back" : "Join us today"}
                    </h1>

                    {
                        type != "sign-in" ? 
                        <InputBox name="fullname" type="text" placeholder="Full Name" icon="fi-rr-user"></InputBox>
                        : ""
                    }

                    <InputBox name="email" type="email" placeholder="Email" icon="fi-rr-envelope"></InputBox>
                    <InputBox name="password" type="password" placeholder="Password" icon="fi-rr-key"></InputBox>
                
                    <button className="btn-dark center mt-14" type="submit" onClick={handleSubmit}>
                        {type.replace("-", " ")}
                    </button>

                    <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
                        <hr className="w-1/2 border-black"/>
                        <p>or</p>
                        <hr className="w-1/2 border-black"/>
                    </div>

                    <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center" onClick={handleGoogleAuth}>
                        <img src={googleIcon} className="w-5"/>
                        continue with google
                    </button>

                    {
                        type == "sign-in"?
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Don't have an account? 
                            <Link to="/signup" className="underline text-black text-xl ml-1">Sign up</Link>    
                        </p>
                        :
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Already have an account? 
                            <Link to="/signin" className="underline text-black text-xl ml-1">Sign in</Link>
                        </p>
                    }
                </form>
            </section>
        </AnimationWrapper>
        
    )
}


export default UserAuthForm;