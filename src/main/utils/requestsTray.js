const axios = require('axios');
const { succesHandlingRequests, errorHandlingRequest, } = require('./auxFunctions')



function registerCategory(body, header){
    return new Promise(async (resolve, reject) => {
        await axios.post('https://api.pedidook.com.br/v1/clientes/', body, header)
        .then(async (answer) => {
            await succesHandlingRequests('category', 'post', body.codigo, answer.data.cliente.id)
        })
        .catch(async (error) => {
            if(error.response.data.erros[0].codigo==24){
                reject({code:24})
            }
            else{
                await errorHandlingRequest('category', 'POST', body.codigo, null, error.response.data.erros, body)
                .then(() => {
                    resolve()
                })
            }
        })
        .finally(() => {
            resolve()
        })    
    })
}


function updateCategory(body, header, idcustomer, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.pedidook.com.br/v1/clientes/${idcustomer}`, body, header)
        .then(async() => {
            await succesHandlingRequests('category', 'put', idHost, idcustomer)
        })
        .catch(async (error) => {
            await errorHandlingRequest('category', 'PUT', idHost, idcustomer, error.response.data.erros, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function deleteCategory(header, idcustomer, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.delete(`https://api.pedidook.com.br/v1/clientes/${idcustomer}`, header)
        .then(async () => {
            await succesHandlingRequests('category', 'delete', idHost, idcustomer)
        })
        .catch(async (error) => {
            await errorHandlingRequest('category', 'DELETE', idHost, idcustomer, error.response.data.erros, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}


// ---------------------------------------------------------------------


function registerProduct(body, header){
    return new Promise(async (resolve, reject) => {
        await axios.post('https://api.pedidook.com.br/v1/produtos/', body, header)
        .then(async (answer) => {
            await succesHandlingRequests('product', 'post', body.codigo, answer.data.produto.id)
        })
        .catch(async (error) => {
            if(error.response.data.erros[0].codigo==24){
                reject({code:24})
            }
            else{
                await errorHandlingRequest('product', 'POST', body.codigo, null, error.response.data.erros, body)
            }
        })
        .finally(() => {
            resolve()
        })    
    })
}


function updateProduct(body, header, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.patch(`https://api.pedidook.com.br/v1/produtos/${idproduct}`, body, header)
        .then(async (response) => {
            await succesHandlingRequests('product', 'update', idHost, idproduct)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'PUT', idHost, idproduct, error.response.data.erros, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function deleteProduct(header, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.delete(`https://api.pedidook.com.br/v1/produtos/${idproduct}`, header)
        .then(async () => {
            await succesHandlingRequests('product', 'delete', idHost, idproduct)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'DELETE', idHost, idproduct, error.response.data.erros, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function undeleteProduct(header, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.patch(`https://api.pedidook.com.br/v1/produtos/${idproduct}/undelete`, '', header)
        .then(async (response) => {
            await succesHandlingRequests('product', 'undelete', idHost, idproduct)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'UNDELETE', idHost, idproduct, error.response.data.erros, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}


// ---------------------------------------------------------------------


function registerVariation(body, header){
    return new Promise(async (resolve, reject) => {
        await axios.post('https://api.pedidook.com.br/v1/clientes/', body, header)
        .then(async (answer) => {
            await succesHandlingRequests('variation', 'post', body.codigo, answer.data.cliente.id)
        })
        .catch(async (error) => {
            if(error.response.data.erros[0].codigo==24){
                reject({code:24})
            }
            else{
                await errorHandlingRequest('variation', 'POST', body.codigo, null, error.response.data.erros, body)
                .then(() => {
                    resolve()
                })
            }
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
            await errorHandlingRequest('variation', 'PUT', idHost, idcustomer, error.response.data.erros, body)
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
            await errorHandlingRequest('variation', 'DELETE', idHost, idcustomer, error.response.data.erros, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}






module.exports = {
    registerCategory,
    updateCategory,
    deleteCategory,
    registerProduct,
    updateProduct,
    deleteProduct,
    undeleteProduct,
    registerVariation,
    updateVariation,
    deleteVariation,
}