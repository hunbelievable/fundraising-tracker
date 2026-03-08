import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ['mustache-historian'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Force mustache-historian (and its /server subpath) to remain external — not
      // bundled into Next.js server chunks. This preserves `__dirname` so the package
      // can locate its data files relative to its own installed location at runtime.
      const prev = config.externals ?? [];
      const prevArr = Array.isArray(prev) ? prev : [prev];
      config.externals = [
        ...prevArr,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ctx: any, cb: (err?: Error | null, result?: string) => void) => {
          const req: string = ctx.request ?? '';
          if (req === 'mustache-historian' || req.startsWith('mustache-historian/')) {
            return cb(null, `commonjs ${req}`);
          }
          cb();
        },
      ];
    } else {
      // Client bundles: stub Node.js built-ins used by mustache-historian/server.
      // getStaticProps code that calls them is stripped from client bundles by Next.js.
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...(config.resolve?.fallback as Record<string, unknown>),
          fs: false,
          path: false,
        },
      };
    }
    return config;
  },
};

export default nextConfig;
