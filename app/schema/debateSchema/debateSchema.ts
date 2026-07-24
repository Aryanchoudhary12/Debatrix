import z from "zod";

export const debateSchema = z.object({
    title: z.string().min(5, "Topic must be at least 5 characters long"),
})

export type DebateSchemaType = z.infer<typeof debateSchema>