function toggleMenu(){
    const nav = document.querySelector('nav ul');
    if(!nav){return;}
    const isOpen = nav.style.display === 'flex';
    if(isOpen){
        nav.style.display = 'none';
        return;
    }
    nav.style.display = 'flex';
    nav.style.flexDirection = 'column';
    nav.style.position = 'absolute';
    nav.style.right = '1rem';
    nav.style.top = '64px';
    nav.style.background = '#fff';
    nav.style.padding = '1rem';
    nav.style.boxShadow = '0 6px 20px rgba(0,0,0,.08)';
}

function openModal(){
    const modal = document.getElementById('modal');
    if(modal){
        modal.style.display = 'flex';
    }
}

function closeModal(){
    const modal = document.getElementById('modal');
    if(modal){
        modal.style.display = 'none';
    }
}




