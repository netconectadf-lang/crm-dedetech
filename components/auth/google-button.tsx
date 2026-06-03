"use client";

import { googleSignInAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function GoogleButton() {
  return (
    <form action={googleSignInAction}>
      <Button type="submit" variant="outline" className="w-full">
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M21.35 11.1H12v2.8h5.35c-.23 1.4-1.6 4.1-5.35 4.1-3.22 0-5.85-2.66-5.85-5.95S8.78 6.1 12 6.1c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.7 3.5 14.6 2.6 12 2.6 6.92 2.6 2.8 6.72 2.8 11.8S6.92 21 12 21c5.27 0 8.76-3.7 8.76-8.92 0-.6-.06-1.05-.16-1.5Z"
          />
        </svg>
        Continuar com Google
      </Button>
    </form>
  );
}
