import React, { useContext } from "react";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";

const PublishForm = () => {

    let {} = useContext()

    const handleCloseEvent = () => {

    }

    return(
        <AnimationWrapper>
            <section>
                <Toaster></Toaster>
                <button className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]" onClick={handleCloseEvent}>
                    <i class="fi fi-br-cross"></i>
                </button>
            </section>
        </AnimationWrapper>
    )
}

export default PublishForm;