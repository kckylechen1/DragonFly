import { createTRPCClient, httpBatchStreamLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@server/routers";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchStreamLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
