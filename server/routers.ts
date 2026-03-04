import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure as protectedProcedureImport } from "./_core/trpc";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  songs: router({
    list: publicProcedure.query(async () => {
      const { getAllSongs } = await import("./db");
      return await getAllSongs();
    }),
    search: publicProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
      const { searchSongs } = await import("./db");
      return await searchSongs(input.query);
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const { getSongById } = await import("./db");
      return await getSongById(input.id);
    }),
  }),
  lyrics: router({
    getBySongId: publicProcedure
      .input(z.object({ songId: z.number(), language: z.string().default("pt") }))
      .query(async ({ input }) => {
        const { getLyricsBySongId } = await import("./db");
        return await getLyricsBySongId(input.songId, input.language);
      }),
  }),
  performances: router({
    create: protectedProcedure
      .input(
        z.object({
          songId: z.number(),
          score: z.number().min(0).max(100),
          pitchAccuracy: z.number().optional(),
          timingAccuracy: z.number().optional(),
          consistencyScore: z.number().optional(),
          recordingUrl: z.string().optional(),
          duration: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createPerformance } = await import("./db");
        return await createPerformance({
          userId: ctx.user.id,
          songId: input.songId,
          score: input.score,
          pitchAccuracy: input.pitchAccuracy,
          timingAccuracy: input.timingAccuracy,
          consistencyScore: input.consistencyScore,
          recordingUrl: input.recordingUrl,
          duration: input.duration,
          notes: input.notes,
        });
      }),
    getUserPerformances: protectedProcedure.query(async ({ ctx }) => {
      const { getUserPerformances } = await import("./db");
      return await getUserPerformances(ctx.user.id);
    }),
    getSongPerformances: publicProcedure
      .input(z.object({ songId: z.number() }))
      .query(async ({ input }) => {
        const { getSongPerformances } = await import("./db");
        return await getSongPerformances(input.songId);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getPerformanceById } = await import("./db");
        return await getPerformanceById(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
