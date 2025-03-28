const conexao = require('node-firebird');
const fs = require ('fs')
const path = require('node:path')
const { app } = require('electron')

const { preparingPostProduct , preparingUpdateProduct, preparingDeleteProduct, preparingUndeleteProduct } = require('./preparingRequests.js');

//const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
const userDataPath = 'src/build';
const pathProducts = path.join(userDataPath, 'products.json');

async function requireAllProducts(config){
    return new Promise(async(resolve, reject) => {
        try {
        conexao.attach(config, function (err, db){
            if (err)
                throw err;
  
            let codigoSQL = `SELECT 
                                P.ID_PRODUTO,
                                P.PRODUTO,
                                P.BARRAS,
                                P.DESCRICAO_COMPLEMENTAR,
                                P.OBS,
                                P.VALOR_VENDA,
                                P.CUSTO,
                                M.MARCA,
                                P.ESTOQUE,
                                P.STATUS,
                                P.GRADE,
                                G.GRUPO,
                                SG.SUBGRUPO
                            FROM PRODUTOS P
                            LEFT JOIN PRODUTOS_MARCA M ON P.MARCA = M.ID
                            LEFT JOIN PRODUTOS_GRUPO G ON P.GRUPO = G.ID
                            LEFT JOIN PRODUTOS_SUBGRUPO SG ON P.SUBGRUPO = SG.ID;
                            `;
  
            db.query(codigoSQL, async function (err, result){
                if (err)
                    resolve({code: 500, msg:'ERRO AO CONSULTAR TABELA PRODUTOS, CONTATAR SUPORTE TECNICO'});
                
                await readingAllRecordProducts(result, 0)
                .then(() => {
                    resolve({code: 200, msg:'PRODUTOS CONSULTADOS COM SUCESSO'});
                })
                
            });
          
        db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
}


async function readingAllRecordProducts(productsRecords, index){
    return new Promise(async (resolve, reject) => {
        let record = productsRecords[index]
        let i = index + 1;

        if(i == productsRecords.length){
            resolve()
        }
        else{
            let product = {
                "Product": {
                    "ean": record.BARRAS,
                    "name": record.PRODUTO,
                    "description": record.DESCRICAO_COMPLEMENTAR,
                    "description_small": record.OBS,
                    "price": parseFloat((record.VALOR_VENDA).replace(',', '.')).toFixed(2),
                    "cost_price": parseFloat((record.CUSTO).replace(',', '.')).toFixed(2),
                    "brand": record.MARCA,
                    "stock": parseInt(record.ESTOQUE),
                    "category_id": null,
                    "available": record.STATUS == 'ATIVO' ? 1 : 0
                }
            }
    
            registerOrUpdateProduct(product)
            .then(async() => {
                await readingAllRecordProducts(productsRecords, i)
                .then(() => {
                    resolve()
                })
            })
        }

    })
}


async function registerOrUpdateProduct(product){
    return new Promise(async (resolve, reject) => {
        let productsDB = JSON.parse(fs.readFileSync(pathProducts))

        var productAlreadyRegister = productsDB[`${product.codigo}`] ? true : false;
        var productIsActiveOnHost = product.status == 'ATIVO' ? true : false;

        const functionReturnStatusOnPedOk = () => {if(productAlreadyRegister){ return productsDB[`${product.codigo}`].status }else{return null}}
        const functionReturnIdProductOnPedOk = () => {if(productAlreadyRegister){ return productsDB[`${product.codigo}`].idPedidoOk }else{return null}}
        
        var statusProductOnPedidoOk = await functionReturnStatusOnPedOk()

        var productIsActiveOnPedidoOK =  statusProductOnPedidoOk == 'ATIVO' ? true : false;
        var idProductOnPedidoOk = functionReturnIdProductOnPedOk()

        if(!productAlreadyRegister&&productIsActiveOnHost){
            await preparingPostProduct(product)
            .then(() => {
                resolve()
            })
        }else
        if(!productAlreadyRegister&&(!productIsActiveOnHost)){
            resolve()
        }else
        if(productAlreadyRegister&&productIsActiveOnHost){
            if(productIsActiveOnPedidoOK){
                await preparingUpdateProduct(product, idProductOnPedidoOk)
                .then(() => {
                    resolve()
                })
            }
            else{
                await preparingUndeleteProduct(idProductOnPedidoOk, product.codigo)
                .then(() => {
                    resolve()
                })
            }
        }else
        if(productAlreadyRegister&&(!productIsActiveOnHost)){
            if(productIsActiveOnPedidoOK){
                await preparingDeleteProduct(idProductOnPedidoOk, product.codigo)
                .then(() => {
                    resolve()
                })
            }
            else{
                resolve()
            }
        }
        
    })
}



module.exports = {
    requireAllProducts,
    readingAllRecordProducts
}
