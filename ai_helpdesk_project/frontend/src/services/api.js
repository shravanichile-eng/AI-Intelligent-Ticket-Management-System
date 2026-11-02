const API=import.meta.env.VITE_API_URL||'http://localhost:8000/api'
export async function api(path, options={}){const token=localStorage.getItem('token'); const headers={'Content-Type':'application/json',...(options.headers||{})}; if(token) headers.Authorization=`Bearer ${token}`; const res=await fetch(API+path,{...options,headers}); if(!res.ok){let msg='Request failed'; try{const d=await res.json();msg=d.detail||msg}catch{} throw new Error(msg)} return res.status===204?null:res.json()}
export const get=(p)=>api(p); export const post=(p,b)=>api(p,{method:'POST',body:JSON.stringify(b)}); export const put=(p,b)=>api(p,{method:'PUT',body:JSON.stringify(b)}); export const patch=(p,b)=>api(p,{method:'PATCH',body:JSON.stringify(b)}); export const del=(p)=>api(p,{method:'DELETE'})
export async function uploadFile(formData) {
  const token = localStorage.getItem('token');

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(API + '/uploads', {
    method: 'POST',
    headers,
    body: formData
  });

  if (!res.ok) {
    let msg = 'File upload failed';

    try {
      const d = await res.json();
      msg = d.detail || msg;
    } catch {}

    throw new Error(msg);
  }

  return res.json();
}