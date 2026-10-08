declare module "@converse/headless/shared/api/public.js" {
  const converse: typeof import("@converse/headless").default;
  export default converse;
}

declare module "@converse/headless/plugins/*";

declare module "sizzle";
