import { Metadata } from "next"
import UsersClient from "./UserClient"


export const metadata: Metadata = {
      title: "Users| VentSafe Admin",
  description: "Review and manage Users"
}

export default function UsersPage() {
 return < UsersClient/>
}
