const { encrypted, uploadFromBase64, decrypt } = require("./cryptoAiease.module");

const signIn = () => {
    return new Promise((resolve, reject) => {
        const requestOptions = {
            method: "POST",
            redirect: "follow"
        };

        fetch("https://www.aiease.ai/api/api/user/visit", requestOptions)
            .then((response) => response.json())
            .then((result) => {
                resolve(result)
            })
            .catch((error) => {
                resolve({
                    error
                })
            });
    })
}
const t2i = async (promptText, size, style_id, session) => {
    return new Promise((resolve, reject) => {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `JWT ${session.token}`);
        myHeaders.append("Content-Type", "application/json");
        const raw = JSON.stringify({
            "gen_type": "art_v1",
            "art_v1_extra_data": {
                "prompt": promptText,
                "style_id": style_id,
                "size": size
            }
        });
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        fetch("https://www.aiease.ai/api/api/gen/text2img", requestOptions)
            .then((response) => response.json())
            .then((result) => {
                resolve(result)
            })
            .catch((error) => {
                resolve({
                    error
                })
            });
    })
}
const getTaskId = async (session, task_id) => {
    return new Promise((resolve, reject) => {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `JWT ${session.token}`);
        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        };

        fetch(`https://www.aiease.ai/api/api/id_photo/task-info?task_id=${task_id}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                resolve(result)
            })
            .catch((error) => {
                resolve({
                    error
                })
            });
    })
}

const uploadImg = async (base64String, session) => {
    return await uploadFromBase64(base64String, session.token)
}
const apply_ai_filters = (img_url, style_id, session) => {
    return new Promise((resolve, reject) => {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `JWT ${session.token}`);
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            gen_type: "ai_filter",
            ai_filter_extra_data: {
                img_url: img_url,
                style_id: style_id
            }
        });
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        fetch("https://www.aiease.ai/api/api/gen/img2img", requestOptions)
            .then((response) => response.json())
            .then((result) => {
                resolve(result)
            })
            .catch((error) => {
                resolve({
                    error
                })
            });
    })
}
const generate_headshot = (img_url, style_id, size, session) => {
    return new Promise((resolve, reject) => {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `JWT ${session.token}`);
        myHeaders.append("Content-Type", "application/json");
        const raw = JSON.stringify({
            gen_type: "headshot",
            headshot_extra_data: {
                img_url: img_url,
                style_id: style_id,
                size: size
            }
        });
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        fetch("https://www.aiease.ai/api/api/gen/img2img", requestOptions)
            .then((response) => response.json())
            .then((result) => {
                resolve(result)
            })
            .catch((error) => {
                resolve({
                    error
                })
            });
    })
}
const enhancePhoto = (img_url, mode = "general", size = '4', session) => {
    return new Promise((resolve, reject) => {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `JWT ${session.token}`);
        myHeaders.append("Content-Type", "application/json");
        const raw = JSON.stringify({
            gen_type: "enhance",
            enhance_extra_data: {
                img_url: img_url,
                mode: mode,
                size: size,
                restore: 1
            }
        }
        );
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        fetch("https://www.aiease.ai/api/api/gen/img2img", requestOptions)
            .then((response) => response.json())
            .then((result) => {
                resolve(result)
            })
            .catch((error) => {
                resolve({
                    error
                })
            });
    })
}
const restorePhoto = (img_url, restore_type = 'recolor', session) => {
    return new Promise((resolve, reject) => {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `JWT ${session.token}`);
        myHeaders.append("Content-Type", "application/json");
        const raw = JSON.stringify({
            gen_type: "restore",
            restore_extra_data: {
                img_url: img_url,
                restore_type: restore_type //"restore_recolor" //restore //recolor
            }
        });
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        fetch("https://www.aiease.ai/api/api/gen/img2img", requestOptions)
            .then((response) => response.json())
            .then((result) => {
                resolve(result)
            })
            .catch((error) => {
                resolve({
                    error
                })
            });
    })
}
const blurImageBackground = (img_url, session) => {
    return new Promise((resolve, reject) => {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `JWT ${session.token}`);
        myHeaders.append("Content-Type", "application/json");
        const raw = JSON.stringify({
            gen_type: "bg_blur",
            bg_blur_extra_data: {
                img_url: img_url
            }
        });
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        fetch("https://www.aiease.ai/api/api/gen/img2img", requestOptions)
            .then((response) => response.json())
            .then((result) => {
                resolve(result)
            })
            .catch((error) => {
                resolve({
                    error
                })
            });
    })
}
module.exports = {
    signIn,
    t2i,
    getTaskId,
    uploadImg,
    apply_ai_filters,
    generate_headshot,
    enhancePhoto,
    restorePhoto,
    blurImageBackground
}