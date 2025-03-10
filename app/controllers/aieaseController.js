const { STATUS, Setup, Saves } = require("../models");
const { t2i, getTaskId, uploadImg, apply_ai_filters, generate_headshot, enhancePhoto, restorePhoto, blurImageBackground } = require("../modules/aiease.module");
const sessionData = require('../modules/session.module')

const sleepSecond = async (timeIn) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true)
        }, 1000 * timeIn)
    })
}
exports.getSessionController = async (req, res) => {
    try {
        const { sessionId } = req.body
        let session = sessionData.getSession(sessionId)
        if (session) {
            res.status(200).json({
                success: true,
                data: session
            });
            return
        }
        res.status(200).json({
            success: false
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Tạo ảnh theo AI. 
exports.createImage = async (req, res) => {
    try {
        const { prompt, size = '1-1', style = 1 } = req.body
        let init = await sessionData.initSession()
        if (init) {
            let result = await t2i(
                prompt,
                size,
                style || 1,
                init)
            if (result && result.code == 200) {
                Saves.create({
                    processId: `${init.sessionId}`,
                    valueProcess: '',
                    reason: ""
                })
                // ----------------------------------
                const waitGetImg = async (task_id) => {
                    for (let index = 0; index < 15; index++) {
                        await sleepSecond(5)
                        let imgResult = await getTaskId(init, task_id)
                        if (imgResult && imgResult?.result?.data?.queue_info) {
                            const queue_info = imgResult?.result?.data?.queue_info
                            const results = imgResult.result.data.results
                            if (queue_info.status && queue_info.status == "success") {
                                // console.log(results)
                                Saves.update({
                                    valueProcess: JSON.stringify(results),
                                    reason: "update sucess",
                                    status: 2
                                }, {
                                    where: {
                                        processId: `${init.sessionId}`
                                    }
                                });
                                return true
                            }
                        }
                    }
                    Saves.update({
                        reason: "error",
                        status: 3
                    }, {
                        where: {
                            processId: `${init.sessionId}`
                        }
                    });
                    return true
                }
                waitGetImg(result.result.task_id)
                return res.status(200).json({
                    success: true,
                    sessionId: `${init.sessionId}`,
                });
            } else {
                return res.status(500).json({
                    success: false,
                    msg: 'create image failed'
                });
            }
        }
        res.status(500).json({
            success: false,
            msg: 'session not avalible'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// API ảnh.
exports.applyAiFilters = async (req, res) => {
    const { images, style } = req.body
    try {
        let init = await sessionData.initSession()
        const uploadPromises = images.map(image => uploadImg(image, init));
        // Wait for all uploads to complete in parallel
        const uploadResults = await Promise.all(uploadPromises);
        const allUploadsSuccessful = uploadResults.every(result => result);
        if (!allUploadsSuccessful) {
            return res.status(400).json({
                success: false,
                msg: 'Some image uploads failed'
            });
        }
        let result = await apply_ai_filters(uploadResults[0], style, init)
        // thực hiện chức năng tiếp
        if (result && result.code == 200) {
            Saves.create({
                processId: `${init.sessionId}`,
                valueProcess: '',
                reason: ""
            })
            const waitGetImg = async (task_id) => {
                for (let index = 0; index < 15; index++) {
                    await sleepSecond(5)
                    let imgResult = await getTaskId(init, task_id)
                    if (imgResult && imgResult?.result?.data?.queue_info) {
                        const queue_info = imgResult?.result?.data?.queue_info
                        const results = imgResult.result.data.results
                        if (queue_info.status && queue_info.status == "success") {
                            // console.log(results)
                            Saves.update({
                                valueProcess: JSON.stringify(results),
                                reason: "update sucess",
                                status: 2
                            }, {
                                where: {
                                    processId: `${init.sessionId}`
                                }
                            });
                            return true
                        }
                    }
                }
                Saves.update({
                    reason: "error",
                    status: 3
                }, {
                    where: {
                        processId: `${init.sessionId}`
                    }
                });
                return true
            }
            waitGetImg(result.result.task_id)
            return res.status(200).json({
                success: true,
                sessionId: `${init.sessionId}`,
            });
        }
        return res.status(500).json({
            success: false,
            msg: 'apply filter failed'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'busy service'
        });
    }

}
// API generate-headshot.
exports.generateHeadshot = async (req, res) => {
    const { images, style, size = '1-1' } = req.body
    try {
        let init = await sessionData.initSession()
        const uploadPromises = images.map(image => uploadImg(image, init));
        // Wait for all uploads to complete in parallel
        const uploadResults = await Promise.all(uploadPromises);
        const allUploadsSuccessful = uploadResults.every(result => result);
        if (!allUploadsSuccessful) {
            return res.status(400).json({
                success: false,
                msg: 'Some image uploads failed'
            });
        }
        let result = await generate_headshot(uploadResults[0], style, size, init)
        // thực hiện chức năng tiếp
        if (result && result.code == 200) {
            Saves.create({
                processId: `${init.sessionId}`,
                valueProcess: '',
                reason: ""
            })
            const waitGetImg = async (task_id) => {
                for (let index = 0; index < 15; index++) {
                    await sleepSecond(5)
                    let imgResult = await getTaskId(init, task_id)
                    if (imgResult && imgResult?.result?.data?.queue_info) {
                        const queue_info = imgResult?.result?.data?.queue_info
                        const results = imgResult.result.data.results
                        if (queue_info.status && queue_info.status == "success") {
                            // console.log(results)
                            Saves.update({
                                valueProcess: JSON.stringify(results),
                                reason: "update sucess",
                                status: 2
                            }, {
                                where: {
                                    processId: `${init.sessionId}`
                                }
                            });
                            return true
                        }
                    }
                }
                Saves.update({
                    reason: "error",
                    status: 3
                }, {
                    where: {
                        processId: `${init.sessionId}`
                    }
                });
                return true
            }
            waitGetImg(result.result.task_id)
            return res.status(200).json({
                success: true,
                sessionId: `${init.sessionId}`,
            });
        }
        return res.status(500).json({
            success: false,
            msg: 'apply filter failed'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'busy service'
        });
    }

}
// API generate-headshot.
exports.enhancePhoto = async (req, res) => {
    const { images, mode, size = '4' } = req.body
    try {
        let init = await sessionData.initSession()
        const uploadPromises = images.map(image => uploadImg(image, init));
        // Wait for all uploads to complete in parallel
        const uploadResults = await Promise.all(uploadPromises);
        const allUploadsSuccessful = uploadResults.every(result => result);
        if (!allUploadsSuccessful) {
            return res.status(400).json({
                success: false,
                msg: 'Some image uploads failed'
            });
        }
        let result = await enhancePhoto(uploadResults[0], mode, size, init)
        // thực hiện chức năng tiếp
        if (result && result.code == 200) {
            Saves.create({
                processId: `${init.sessionId}`,
                valueProcess: '',
                reason: ""
            })
            const waitGetImg = async (task_id) => {
                for (let index = 0; index < 15; index++) {
                    await sleepSecond(5)
                    let imgResult = await getTaskId(init, task_id)
                    if (imgResult && imgResult?.result?.data?.queue_info) {
                        const queue_info = imgResult?.result?.data?.queue_info
                        const results = imgResult.result.data.results
                        if (queue_info.status && queue_info.status == "success") {
                            // console.log(results)
                            Saves.update({
                                valueProcess: JSON.stringify(results),
                                reason: "update sucess",
                                status: 2
                            }, {
                                where: {
                                    processId: `${init.sessionId}`
                                }
                            });
                            return true
                        }
                    }
                }
                Saves.update({
                    reason: "error",
                    status: 3
                }, {
                    where: {
                        processId: `${init.sessionId}`
                    }
                });
                return true
            }
            waitGetImg(result.result.task_id)
            return res.status(200).json({
                success: true,
                sessionId: `${init.sessionId}`,
            });
        }
        return res.status(500).json({
            success: false,
            msg: 'apply filter failed'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'busy service'
        });
    }

}

exports.restorePhoto = async (req, res) => {
    const { images, restore_type = 'recolor' } = req.body
    try {
        let init = await sessionData.initSession()
        const uploadPromises = images.map(image => uploadImg(image, init));
        // Wait for all uploads to complete in parallel
        const uploadResults = await Promise.all(uploadPromises);
        const allUploadsSuccessful = uploadResults.every(result => result);
        if (!allUploadsSuccessful) {
            return res.status(400).json({
                success: false,
                msg: 'Some image uploads failed'
            });
        }
        let result = await restorePhoto(uploadResults[0], restore_type, init)
        // thực hiện chức năng tiếp
        if (result && result.code == 200) {
            Saves.create({
                processId: `${init.sessionId}`,
                valueProcess: '',
                reason: ""
            })
            const waitGetImg = async (task_id) => {
                for (let index = 0; index < 15; index++) {
                    await sleepSecond(5)
                    let imgResult = await getTaskId(init, task_id)
                    if (imgResult && imgResult?.result?.data?.queue_info) {
                        const queue_info = imgResult?.result?.data?.queue_info
                        const results = imgResult.result.data.results
                        if (queue_info.status && queue_info.status == "success") {
                            // console.log(results)
                            Saves.update({
                                valueProcess: JSON.stringify(results),
                                reason: "update sucess",
                                status: 2
                            }, {
                                where: {
                                    processId: `${init.sessionId}`
                                }
                            });
                            return true
                        }
                    }
                }
                Saves.update({
                    reason: "error",
                    status: 3
                }, {
                    where: {
                        processId: `${init.sessionId}`
                    }
                });
                return true
            }
            waitGetImg(result.result.task_id)
            return res.status(200).json({
                success: true,
                sessionId: `${init.sessionId}`,
            });
        }
        return res.status(500).json({
            success: false,
            msg: 'apply filter failed'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'busy service'
        });
    }

}
exports.blurImageBackground = async (req, res) => {
    const { images } = req.body
    try {
        let init = await sessionData.initSession()
        const uploadPromises = images.map(image => uploadImg(image, init));
        // Wait for all uploads to complete in parallel
        const uploadResults = await Promise.all(uploadPromises);
        const allUploadsSuccessful = uploadResults.every(result => result);
        if (!allUploadsSuccessful) {
            return res.status(400).json({
                success: false,
                msg: 'Some image uploads failed'
            });
        }
        let result = await blurImageBackground(uploadResults[0], init)
        // thực hiện chức năng tiếp
        if (result && result.code == 200) {
            Saves.create({
                processId: `${init.sessionId}`,
                valueProcess: '',
                reason: ""
            })
            const waitGetImg = async (task_id) => {
                for (let index = 0; index < 15; index++) {
                    await sleepSecond(5)
                    let imgResult = await getTaskId(init, task_id)
                    if (imgResult && imgResult?.result?.data?.queue_info) {
                        const queue_info = imgResult?.result?.data?.queue_info
                        const results = imgResult.result.data.results
                        if (queue_info.status && queue_info.status == "success") {
                            // console.log(results)
                            Saves.update({
                                valueProcess: JSON.stringify(results),
                                reason: "update sucess",
                                status: 2
                            }, {
                                where: {
                                    processId: `${init.sessionId}`
                                }
                            });
                            return true
                        }
                    }
                }
                Saves.update({
                    reason: "error",
                    status: 3
                }, {
                    where: {
                        processId: `${init.sessionId}`
                    }
                });
                return true
            }
            waitGetImg(result.result.task_id)
            return res.status(200).json({
                success: true,
                sessionId: `${init.sessionId}`,
            });
        }
        return res.status(500).json({
            success: false,
            msg: 'apply filter failed'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'busy service'
        });
    }

}
//TASK dữ liệu
exports.getTask = async (req, res) => {
    const { processId } = req.body
    console.log(processId)
    try {
        if (!processId) {
            res.status(500).json({
                success: false,
                msg: 'session not avalible'
            });
        }
        let dataW = await Saves.findAll({
            where: {
                processId: processId
            }
        })
        if (dataW && dataW.length > 0) {
            dataW = dataW[0]
            if (dataW.status == 1) {
                return res.status(500).json({
                    success: false,
                    msg: 'pending'
                });
            }
            else if (dataW.status == 3) {
                return res.status(500).json({
                    success: false,
                    msg: 'error'
                });
            } else {
                return res.status(200).json({
                    success: true,
                    data: JSON.parse(dataW.valueProcess)
                });
            }
        }
        return res.status(500).json({
            success: false,
            msg: 'not found'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'session not avalible'
        });
    }
}