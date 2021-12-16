const result = (code, message, data = []) =>{
    return {status: code, message: message, data};
}

module.exports = {
    result: result
}