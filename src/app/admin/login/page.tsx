import type { Metadata } from "next";
import AdminLoginClient from "./AdminLoginClient"



export const metadata: Metadata = {
  title: "Admin Login | VentSafe Admin",
  description: "Restricted access — VentSafe admin portal",
};


export default function AdminLoginPage(){
    return <AdminLoginClient />;
}