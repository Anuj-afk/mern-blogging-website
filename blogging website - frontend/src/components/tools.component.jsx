import React from "react";
import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import { uploadImage } from "../common/aws";

const uploadImageByURL = (e) => {
    let link = new Promise((resolve, reject) => {
        try{
            resolve(e)
        }
        catch(err){
            reject(err)
        }
    })

    return link.then(url => {
        return{
            success: 1,
            file: {url}
        }
    })
}

const uploadImageByFile = (e) => {
    return uploadImage(e).then(url => {
        if(url){
            return{
                success: 1,
                file: {url}
            }
        }
    })
}
export const tools = {
    embed: Embed,
    list: {
        class: List,
        inlineToolbar: true,
        config: {
            defaultStyle: 'unordered'
        }
    },
    image:{       
        class: Image,
        config: {
            uploader: {
                uploadByFile: uploadImageByFile,
                uploadByUrl: uploadImageByURL,
            },
        },
    },
    header: {
        class: Header,      
        config: {
            placeholder: 'Enter a header',
            levels: [2, 3, 4],
            defaultLevel: 3
        },
        inlineToolbar: true,
    },
    quote: {
        class: Quote,
        inlineToolbar: true,
        config: {
            placeholder: 'Enter a quote',
            defaultAuthor: 'Unknown'
        }
    },
    marker: Marker,
    inlineCode: InlineCode,
}