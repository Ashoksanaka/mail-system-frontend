import { SignIn } from "@clerk/react";

export default function SignInPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/templates"
      />
    </div>
  );
}
