import React,{createContext,useContext} from 'react';
const ctx=createContext(null);
const demoUser={id:'preview-only',email:'preview@example.invalid',full_name:'Önizleme',role:'admin'};
export function AuthProvider({children}){return <ctx.Provider value={{user:demoUser,isAuthenticated:true,isLoadingAuth:false,isLoadingPublicSettings:false,authError:null,appPublicSettings:{},authChecked:true,logout:()=>{},navigateToLogin:()=>{},checkUserAuth:async()=>demoUser,checkAppState:async()=>{}}}>{children}</ctx.Provider>;}
export const useAuth=()=>useContext(ctx);
