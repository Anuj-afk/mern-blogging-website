import axios from "axios";

export const uploadImage = async (img) => {
    let imgUrl = null;

    await axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/get-upload-url")
    .then(async ({data: {uploadUrl}}) => {
        
        
        await axios({
            method: "PUT",
            url: uploadUrl,
            data: img,
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
        .then(() => {
            console.log("1b")
            imgUrl = uploadUrl.split("?")[0];
        })
        .catch(err => {
            console.log("🚀 ~ .then ~ uploadUrl:", uploadUrl)
            console.log("1a")
            console.log(err);
        })
    })
    .catch(err => {
        console.log(2)
        console.log(err);
    })
    return imgUrl;
}