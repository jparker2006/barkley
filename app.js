(() => {
'use strict';
document.documentElement.classList.add('js');
const $=(q,scope=document)=>scope.querySelector(q);
const $$=(q,scope=document)=>[...scope.querySelectorAll(q)];
const dialog=$('.album-dialog');if(!dialog)return;
let media=[],current=0,loading,requestVersion=0;
function getMedia(){if(!loading)loading=fetch('media.json').then(r=>{if(!r.ok)throw Error('Could not load media');return r.json()}).then(items=>{media=[...items.filter(m=>m.type==='img'),...items.filter(m=>m.type==='video')];return media}).catch(e=>{loading=null;throw e});return loading}
function clearMedia(){const video=$('video',dialog);if(video){video.pause();video.removeAttribute('src');video.load()}$('#album-media').replaceChildren()}
function showMedia(index){
 current=(index+media.length)%media.length;const item=media[current];clearMedia();
 const node=document.createElement(item.type==='video'?'video':'img');
 if(item.type==='video'){node.controls=true;node.preload='metadata';node.playsInline=true;node.poster=item.poster;node.setAttribute('aria-label',item.title)}else{node.alt=item.title;node.decoding='async'}
 node.addEventListener('error',()=>{if(!node.isConnected)return;const error=document.createElement('p');error.className='album-error';error.textContent='This post could not load. ';const link=document.createElement('a');link.href=item.src;link.textContent='Open the original';error.append(link);$('#album-media').replaceChildren(error)},{once:true});
 node.src=item.display||item.src;$('#album-media').append(node);$('#media-caption').textContent=item.caption||item.title;$('#media-count').textContent=(current+1)+' / '+media.length+(item.type==='video'?' · Video':'');
 $$('.album-thumbs button').forEach((button,i)=>button.setAttribute('aria-current',String(i===current)));
}
function thumbnails(){if($('.album-thumbs').childElementCount)return;media.forEach((item,index)=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',item.title+(item.type==='video'?' (video)':''));const img=document.createElement('img');img.src=item.thumb;img.alt='';img.width=50;img.height=50;img.loading='lazy';button.append(img);if(item.type==='video'){const marker=document.createElement('span');marker.className='video-marker';marker.setAttribute('aria-hidden','true');marker.textContent='▶';button.append(marker)}button.addEventListener('click',()=>showMedia(index));$('.album-thumbs').append(button)})}
async function openAlbum(event){
 event.preventDefault();const id=Number(event.currentTarget.dataset.mediaId);const version=++requestVersion;dialog.showModal();$('#album-media').innerHTML='<p>Opening the camera roll…</p>';$('#media-caption').textContent='';$('#media-count').textContent='';
 try{await getMedia();if(!dialog.open||version!==requestVersion)return;thumbnails();const index=media.findIndex(m=>m.id===id);showMedia(index<0?0:index)}catch{if(version!==requestVersion||!dialog.open)return;$('#album-media').innerHTML='<p class="album-error">The album could not load. <a href="album.html">Open the photo page.</a></p>'}
}
$$('[data-media-id]').forEach(link=>link.addEventListener('click',openAlbum));
$('.close-album').addEventListener('click',()=>{clearMedia();dialog.close()});dialog.addEventListener('close',()=>{requestVersion++;clearMedia()});
$('#previous').addEventListener('click',()=>{if(media.length)showMedia(current-1)});$('#next').addEventListener('click',()=>{if(media.length)showMedia(current+1)});
dialog.addEventListener('keydown',e=>{if(!media.length||e.target.closest('video'))return;if(e.key==='ArrowLeft'){e.preventDefault();showMedia(current-1)}if(e.key==='ArrowRight'){e.preventDefault();showMedia(current+1)}});
})();
