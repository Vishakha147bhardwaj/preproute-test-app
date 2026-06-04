import axios from 'axios';
const BASE_URL = 'https://admin-moderator-backend-staging.up.railway.app/api';
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});
//axios interceptor to auto attach JWT token to every request
axiosInstance.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}
, (error)=>{
    return Promise.reject(error);
}
);
//Response interceptor to handle 401 globally
axiosInstance.interceptors.response.use((response)=>
     response,
(error)=>{if(error.response && error.response.status === 401){localStorage.removeItem('token');localStorage.removeItem('user');window.location.href = '/login';}return Promise.reject(error);   
})

export default axiosInstance;