import express from 'express';
import mongoose from 'mongoose';
import "dotenv/config"
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken'
import cors from 'cors';
import admin    from "firebase-admin"
import serviceAccount from "./mern-blogging-website-e3921-firebase-adminsdk-hyrx9-a1aabfb15f.json" assert{type: "json"}
import {getAuth} from "firebase-admin/auth"
import aws from "aws-sdk";

import User from "./Schema/User.js"
import Blog from "./Schema/Blog.js"
import Notification from './Schema/Notification.js';

const server = express();

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true,
})

const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1'
});

const generateUploadUrl = async () => {
    const date = new Date();
    const imageName = `${nanoid()}-${date.getTime}.jpeg`
    return await s3.getSignedUrlPromise('putObject', {
        Bucket: 'mernblogging-website',
        Key: imageName,
        Expires: 60*60, 
        ContentType: 'image/jpeg',
    })
}

const verifyJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){
        return res.status(401).json({"error": "No token provided"})
    }
    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if(err){
            return res.status(403).json({"error": "Invalid token"})
        }
        req.user = user.id;
        next();
    })
}

server.use(express.json());
server.use(cors());

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password


const formatDatatoSend = (user) => {

    const access_token = jwt.sign({id: user._id}, process.env.SECRET_ACCESS_KEY)

    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
    }
}
const generateUsername = async (email) => {
    let username = email.split('@')[0];

    let usernameExists = await User.exists({"personal_info.username": username}).then((result) => result)
    usernameExists ? username += nanoid().substring(0, 5): "";

    return username;
}
server.post("/signup", (req, res) => {

    let {fullname, email, password} = req.body;

    if(fullname.length < 3){
        return res.status(403).json({"error": "Fullname must be at least 3 characters long"});
    }
    if(!email.length){
        return res.status(403).json({"error": "Enter Email"})
    }
    if(!emailRegex.test(email)){
        return res.status(403).json({"error": "Email is invalid"});
    }
    if(!passwordRegex.test(password)){
        return res.status(403).json({"error": "Password should contain at least one uppercase letter, one lowercase letter,number and be at least 6 characters long"});
    }

    bcrypt.hash(password, 10, async (err, hashed_password) => {
        let username = await generateUsername(email);

        let user = new User({
            personal_info: {fullname, email, password: hashed_password, username}
        });

        user.save().then((u) => {
            
            return res.status(200).json(formatDatatoSend(u))

        })
        .catch(err => {

            if(err.code == 11000){
                return res.status(500).json({"error": "Email already exists"})
            }
            return res.status(500).json({"error": err.message});
        })
    })
})

server.post("/signin" , (req, res) => {
    let {email, password} = req.body;

    User.findOne({"personal_info.email": email}).then((user) => {
        if(!user){
            return res.status(403).json({"error": "Email not found"});
        }
        if(!user.google_auth){
            bcrypt.compare(password, user.personal_info.password, (err, result) => {
                if(err){
                    return res.status(403).json({"error": "Error occured while login please try again"});
                }
                if(!result){
                    return res.status(403).json({"error": "Invalid Password"});
                }
                else{
                    return res.status(200).json(formatDatatoSend(user));
                }
            })
        }
        else{
            return res.status(403).json({"error": "This email was signed up without password. Please login with google to access the account"})
        }

    })
    .catch(err =>{
        console.log(err.message);
        return res.status(500).json({"error": err.message});
    })
})

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

server.post("/google-auth", async (req, res) =>{
    let {access_token} = req.body;
    getAuth().verifyIdToken(access_token)
    .then(async (decodedUser) => {

        let {email, name, picture} = decodedUser;
        picture = picture.replace("s96-c", "s384-c")

        let user = await User.findOne({"personal_info.email": email}).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {
            return u || null;
        })
        .catch(err => {
            return res.status(500).json({"error": err.message})
        })
        if(user){
            if(!user.google_auth){
                return res.status(403).json({"error": "This email was signed up without google. Please log in with password to access the account" })
            }
        }
        else{
            let username = await generateUsername(email);

            user = new User({
                personal_info: {fullname: name, email, profile_img: picture, username},
                google_auth: true
            });

            await user.save().then((u) => {
                user = u;
            })
            .catch((err) => {
                return res.status(500).json({"error": err.message})
            })
        }

        return res.status(200).json(formatDatatoSend(user));
    })
    .catch(err => {
        return res.status(500).json({"error": "Error occured while login please try again"});
    })
})

server.post("/search-blogs", (req, res) => {
    let { tag, query, page, author, limit, eliminate_blog} = req.body;
    let findQuery;
    if(tag){
        findQuery = {tags: tag, draft: false, blog_id: {$ne: eliminate_blog}};
    }
    else if(query){
        findQuery = {title: new RegExp(query, 'i'), draft: false};
    }
    else if(author){
        findQuery = {author, draft: false};
    }
    let maxLimit = limit || 5;
    Blog.find(findQuery)
    .populate("author", "personal_info.fullname personal_info.profile_img personal_info.username -_id")
    .sort({"publishedAt": -1})
    .skip((page - 1) * maxLimit)
    .select("blog_id title des banner activity tags publishedAt -_id")
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({blogs})
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({error: "Error occured while fetching latest blogs"})
    })
})

server.get('/get-upload-url', (req, res) =>{
    generateUploadUrl().then(url => {
        return res.status(200).json({uploadUrl: url});
        
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({"error": err.message});
    })
})

server.post('/create-blog', verifyJWT,(req, res) =>{

    let authorId = req.user;



    let {title, des, banner, tags, content, draft, id} = req.body;

    if(!title.length){
        return res.status(403).json({"error": "Title is required"})
    }

    if(!draft){
        if(!des.length || des.length > 200){
            return res.status(403).json({"error": "Description is required under 200 characters"})
        }
        if(!banner.length){
            return res.status(403).json({"error": "Banner image is required"})
        }
        if(!tags.length || tags.length > 10){
            return res.status(403).json({"error": "At least one tag is required, maximum 10"})
        }
        if(!content.blocks.length){
            return res.status(403).json({"error": "Content is required"})
        }
    }

    tags = tags.map(tag => tag.toLowerCase())
    let blog_id = id || title.replace(/[^a-z-A-Z0-9]/g, " ").replace(/\s+/g, "-").trim() + nanoid();
    if(id){

        Blog.findOneAndUpdate({blog_id: blog_id}, {title, des, banner, content, tags, draft: draft ? draft : false})
        .then(() => {
            return res.status(200).json({id: blog_id})
        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({error: "failed to update blog"})
        })

    }
    else{
        let blog = new Blog({
            title, des, banner, content, tags, author: authorId, blog_id, draft: Boolean(draft)
        })
        blog.save().then((b) => {
            let incrementVal = draft ? 0 : 1;
            User.findByIdAndUpdate(authorId, {$inc: {"account_info.total_posts": incrementVal}, $push: {"blogs": b._id}})
            .then(user => {
                return res.status(200).json({id: blog.blog_id})
            })
            .catch(err => {
                console.log(err.message);
                return res.status(500).json({error: "failed to update total posts number"})
            })
        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({error: "Error occured while creating blog"})
        })
    }
})

server.post('/latest-blogs', (req, res) => {
    let {page} = req.body;
    let maxLimit = 5;

    Blog.find({draft: false}).populate("author", "personal_info.fullname personal_info.profile_img personal_info.username -_id")
    .sort({"publishedAt": -1})
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip(maxLimit*(page-1))
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({blogs})
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({error: "Error occured while fetching latest blogs"})
    })
})

server.get('/trending-blogs', (req, res) => {
    let maxLimit = 5;

    Blog.find({draft: false}).populate("author", "personal_info.fullname personal_info.profile_img personal_info.username -_id")
    .sort({"activity.total_reads": -1, "activity.total_likes": -1, "publishedAt": -1})
    .select("blog_id title publishedAt -_id")
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({blogs})
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({error: "Error occured while fetching latest blogs"})
    })
})

server.post("/all-latest-blogs-count", (req, res) => {
    Blog.countDocuments({draft: false})
    .then(count => {
        return res.status(200).json({totalDocs: count})
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({error: "Error occured while fetching latest blogs count"})
    })
})

server.post("/search-blogs-count", (req, res) => {
    let {tag, query, author} = req.body;
    let findQuery;
    if(tag){
        findQuery = {tags: tag, draft: false};
    }
    else if(query){
        findQuery = {title: new RegExp(query, 'i'), draft: false};
    }
    else if(author){
        findQuery = {author, draft: false};
    }
    Blog.countDocuments(findQuery)
    .then(count => {
        return res.status(200).json({totalDocs: count})
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({error: "Error occured while fetching latest blogs count"})
    })
})

server.post("/search-users", (req, res) => {
    let {query} = req.body;

    User.find({"personal_info.username": new RegExp(query, "i")})
    .limit(50)
    .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
    .then(users => {
        return res.status(200).json({users})
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({error: "Error occured while fetching users"})
    })
})

server.post("/get-profile", (req, res) => {
    let {username} = req.body;
    User.findOne({"personal_info.username": username})
    .select("-personal_info.password -google_auth -updatedAt -blogs")
    .then(user => {
        return res.status(200).json(user)
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({error: "Error occured while fetching user profile"})
    })
})

server.post("/get-blog", (req, res) => {
    let {blog_id, draft, mode} = req.body;
    let incrementVal = mode != "edit" ? 1: 0;
    Blog.findOneAndUpdate({blog_id}, {$inc: {"activity.total_reads": incrementVal}})
    .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
    .select("title des content banner activity publishedAt blog_id tags")
    .then(blog => {
        User.findOneAndUpdate({"personal_info.username": blog.author.personal_info.username}, {$inc: {"activity.total_reads": incrementVal}})
        .catch(err => {
            return res.status(500).json({error:  err.message})
        })
        if(blog.draft && !draft){
            return res.status(404).json({error: "You can not access draft blogs"})
        }
        return res.status(200).json({blog});
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({error: "Error occured while fetching blog"})
    })

})

server.post("/like-blog", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id, islikedByUser} = req.body;
    let incrementVal = islikedByUser ? -1 : 1;

    Blog.findOneAndUpdate({ _id, }, {$inc: {"activity.total_likes": incrementVal}})
    .then(blog => {
        if(!islikedByUser){
            let like = new Notification({ type: "like", blog: _id, notification_for: blog.author, user: user_id})
            like.save()
            .then(notification => {
                return res.status(200).json({liked_by_user: true})
            })
            .catch(err => {
                console.log(err.message);
                return res.status(500).json({error: "Failed to create notification"})
            })
        }
    })
})

server.post("/isliked-by-user", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id } = req.body;

    Notification.exists({ user: user_id, type: "like", blog: _id})
    .then(result => {
        return res.status(200).json({result})
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({error: "Error occured while checking if liked by user"})
    })
})

let port = 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});