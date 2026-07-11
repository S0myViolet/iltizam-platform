// Alias: /signin permanently forwards to the canonical /sign-in.

import { redirect } from "next/navigation";

export default function SignInAlias() {
  redirect("/sign-in");
}
