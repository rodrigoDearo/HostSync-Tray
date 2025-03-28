const { registerProduct, updateProduct, deleteProduct, undeleteProduct, registerCategory, deleteCategory, registerVariation, updateVariation, deleteVariation, } = require('./requestsTray');
const { returnValueFromJson } = require('./manageInfoUser');
const { returnInfo } = require('../envManager');

async function preparingPostProduct(product){
    return new Promise(async (resolve, reject) => {
        let body, header;

        await returnHeader()
        .then(async (response) => {
            header = response;
        })
        .then(async (response) => {
            body = response
            await postProduct(body, header)
        }) 
        .then(() => {
            resolve()
        })

    })  
}


async function preparingUpdateProduct(product, idproduct){
    return new Promise(async (resolve, reject) => {
        let body, header, idHost;

        await returnHeader()
        .then(async (response) => {
            header = response;
            idHost = product.codigo;

            delete product.embalagem
            delete product.status
            return product
        })
        .then(async (response) => {
            body = response
            await patchProduct(body, header, idproduct, idHost);
        })
        .then(() => {
            resolve()
        })
    })
}


async function preparingDeleteProduct(idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        let header;

        await returnHeader()
        .then(async (response) => {
            header = response
        })
        .then(async () => {
            await deleteProduct(header, idproduct, idHost)
        })
        .then(() => {
            resolve()
        })
    })
}


async function preparingUndeleteProduct(idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        let header;

        await returnHeader()
        .then(async (response) => {
            header = response
        })
        .then(async () => {
            await undeleteProduct(header, idproduct, idHost)
        })
        .then(() => {
            resolve()
        })
    })
}


async function preparingPostCategory(){
    return new Promise(async (resolve, reject) => {
        let body, infosTray;

        await returnURLandAccessToken()
        .then(async (response) => {
            infosTray = response;

            return product
        })
        .then(async (response) => {
            body = response
            await registerCategory(infosTray[0], infosTray[1])
        }) 
        .then(() => {
            resolve()
        })

    })  
}


async function preparingPostSubCategory(){
    return new Promise(async (resolve, reject) => {
        let body, header;

        await returnHeader()
        .then(async (response) => {
            header = response;
            product.id_parceiro  = await returnValueFromJson('idparceiro')

            delete product.status
            return product
        })
        .then(async (response) => {
            body = response
            await postProduct(body, header)
        }) 
        .then(() => {
            resolve()
        })

    })  
}




async function returnURLandAccessToken(){
    return new Promise(async (resolve, reject) => {
        let url, access_token;

        await returnValueFromJson('access_token')
        .then(async accessTray => {
            access_token = accessTray
            await returnValueFromJson('urltray')
            .then(async urlTray => {
                url = urlTray
                resolve([url, access_token])
            })
        })

    })
}





module.exports = {
    preparingPostProduct,
    preparingUpdateProduct,
    preparingDeleteProduct,
    preparingUndeleteProduct,
}