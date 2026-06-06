import { redirect } from "next/navigation";

/** Legacy URL — access form now lives on the homepage. */
export default function AccessPage() {
  redirect("/#access");
}
