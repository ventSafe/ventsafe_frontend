import type {Metadata} from "next"
import AdminsClient from "./AdminsClient"

export const metadata: Metadata = {
title: "Admins | VentSafe Admin",
description: "Review and manage all Admins logs and activities"
};

export default function ManageAdminsPage() {
 return <AdminsClient />
}
