const axios = require('axios');
const { succesHandlingRequests, errorHandlingRequest, } = require('./auxFunctions')



function registerProduct(url, access_token, body, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.post(`${url}/products?access_token=${access_token}`, body)
        .then(async (answer) => {
            await succesHandlingRequests('product', 'post', idHost, answer.data.id, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'POST', idHost, null, error.response.data.causes, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function updateProduct(url, access_token, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`${url}/products/${idproduct}?access_token=${access_token}`, body)
        .then(async (response) => {
            await succesHandlingRequests('product', 'update', idHost, idproduct, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'PUT', idHost, idproduct, error.response.data.causes, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function deleteProduct(url, access_token, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`${url}/products/${idproduct}?access_token=${access_token}`, body)
        .then(async () => {
            await succesHandlingRequests('product', 'delete', idHost, idproduct, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'DELETE', idHost, idproduct, error.response.data.causes, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function undeleteProduct(url, access_token, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`${url}/products/${idproduct}?access_token=${access_token}`, body)
        .then(async (response) => {
            await succesHandlingRequests('product', 'undelete', idHost, idproduct, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'UNDELETE', idHost, idproduct, error.response.data.causes, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


// ---------------------------------------------------------------------


function registerCategory(url, access_token, body, type, category){
    return new Promise(async (resolve, reject) => {
        await axios.post(`${url}/categories?access_token=${access_token}`, body)
        .then(async (answer) => {
            console.log(answer.data)
            await succesHandlingRequests(type, 'post', body.Category.name, answer.data.id, [body.Category.name, category])
            .then(async () => {
                resolve(answer.data.id)
            })
        })
        .catch(async (error) => {
            console.log(error.response.data)
            await errorHandlingRequest(type, 'POST', body.Category.name, null, error.response.data.causes, body)
            .then(() => {
                resolve()
            })
        })  
    })
}

/* VER DEPOIS
function deleteCategory(header, idcustomer, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.delete(`${url}/categories/:id`, header)
        .then(async () => {
            await succesHandlingRequests('category', 'delete', idHost, idcustomer)
        })
        .catch(async (error) => {
            await errorHandlingRequest('category', 'DELETE', idHost, idcustomer, error.response.data.causes, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}*/


// ---------------------------------------------------------------------


function registerVariation(body, header){
    return new Promise(async (resolve, reject) => {
        await axios.post('https://api.pedidook.com.br/v1/clientes/', body, header)
        .then(async (answer) => {
            await succesHandlingRequests('variation', 'post', body.codigo, answer.data.id)
        })
        .catch(async (error) => {
            await errorHandlingRequest('variation', 'POST', body.codigo, null, error.response.data.causes, body)
            .then(() => {
                resolve()
            })
        })
        .finally(() => {
            resolve()
        })    
    })
}


function updateVariation(body, header, idcustomer, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.pedidook.com.br/v1/clientes/${idcustomer}`, body, header)
        .then(async() => {
            await succesHandlingRequests('variation', 'put', idHost, idcustomer)
        })
        .catch(async (error) => {
            await errorHandlingRequest('variation', 'PUT', idHost, idcustomer, error.response.data.causes, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function deleteVariation(header, idcustomer, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.delete(`https://api.pedidook.com.br/v1/clientes/${idcustomer}`, header)
        .then(async () => {
            await succesHandlingRequests('variation', 'delete', idHost, idcustomer)
        })
        .catch(async (error) => {
            await errorHandlingRequest('variation', 'DELETE', idHost, idcustomer, error.response.data.causes, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}


// ---------------------------------------------------------------------





module.exports = { 
    registerProduct,
    updateProduct,
    deleteProduct,
    undeleteProduct,
    registerCategory,
    //deleteCategory,
    registerVariation,
    updateVariation,
    deleteVariation,
}