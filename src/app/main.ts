import './styles.css';
import './fitting.css';
if(new URLSearchParams(location.search).get('mode')==='legacy'){
 await import('./legacy');
 const link=document.createElement('a');link.href='./';link.textContent='← Оснастка корабля';link.className='fit-legacy-link';document.querySelector('#app')!.prepend(link);
}else{
 const [{loadCandidateCatalog},{mountFitting}]=await Promise.all([import('../fitting/catalog'),import('./fitting')]);
 mountFitting(document.querySelector('#app')!,loadCandidateCatalog("ship-fitting-0.2.4"),()=>{});
}
