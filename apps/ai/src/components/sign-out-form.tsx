import Form from "next/form";

// Server action form component for user sign out (currently disabled)
// import { signOut } from "@/app/(auth)/auth";

// Sign out form with server action for handling user logout
export const SignOutForm = () => {
  // Render form with sign out button (action currently commented out)
  return (
    <Form
      action={async () => {
        "use server";

        // await signOut({
        //   redirectTo: "/",
        // });
      }}
      className="w-full"
    >
      <button
        className="w-full px-1 py-0.5 text-left text-red-500"
        type="submit"
      >
        Sign out
      </button>
    </Form>
  );
};
