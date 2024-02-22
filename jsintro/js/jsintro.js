window.onload = function (){ 
    meny = document.querySelector("header div ul");
    meny.addEventListener('click',function (event){
        if(event.target.tagName=='LI'){
            parentenschildren=event.target.parentNode.querySelectorAll("div");
            [...parentenschildren].forEach(diven =>{
                diven.classList.remove('classVisible');
            })
            event.target.children[0].classList.toggle('classVisible');
        }
        else{
            console.log("klicka rätt mf!");
        }
    });
};