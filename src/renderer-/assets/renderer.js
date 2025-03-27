
async function getInfoUserFromJSON(fieldRequire){
    let fieldValue = await window.api.getInfoUser(fieldRequire);
    return fieldValue
}

function buttonCloseApp(){
    window.api.closeApp()
}

function buttonMinimizeApp(){
    window.api.minimizeApp()
}

async function saveInfoHost(){
    event.preventDefault();

    let pathdb = document.getElementById('pathdb-input').value;
    
    try {
        await window.api.saveHost(pathdb);
        showSuccessPopup()
        document.getElementById('pathdb-input').style.border = "2px solid green"
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }
}

async function saveInfoPedidoOk(){
    event.preventDefault();
    
    let token = document.getElementById('token-input').value;
    
    try {
        await window.api.savePedidoOk(token)
        showSuccessPopup()
        document.getElementById('token-input').style.border = "2px solid green"
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }
}

async function startSync(){
    await loadingPage(true)
    await window.api.start()
    .then(async () => {
        await loadingPage(false)
    })
  //  alert(mensage)
}






async function loadingPage(status){
    let buttons = document.getElementsByClassName('btn');
    let gifLoading = document.getElementById('gif-loading');
    let backgroundLoading = document.getElementById('background-loading')

    if(status){
        for(let i=0; i<buttons.length; i++){
            buttons[i].disabled = true
        }
        gifLoading.src = './assets/loading.gif'
        backgroundLoading.style.width = '100vw';
        backgroundLoading.style.height = '100vh' 
    }
    else{
        for(let i=0; i<buttons.length; i++){
            buttons[i].disabled = false
        }
        gifLoading.src = '';
        backgroundLoading.style.width = '0';
        backgroundLoading.style.height = '0' 
    }
}


function showSuccessPopup() {
    const popup = document.getElementById("successPopup");
    popup.classList.add("show");
  
    setTimeout(() => {
      popup.classList.remove("show");
    }, 2000); // Fecha após 3 segundos
  }

