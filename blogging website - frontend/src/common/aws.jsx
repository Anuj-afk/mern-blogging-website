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
                "Content-Type": 'multipart/form-data'
            }
        })
        .then(() => {
            imgUrl = uploadUrl.split("?")[0];
        })
    })

    return imgUrl;
}