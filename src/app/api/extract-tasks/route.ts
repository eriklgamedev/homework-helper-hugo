import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const TaskSchema = z.object({
  tasks: z.array(
    z.object({
      text: z.string().describe("The homework task description"),
      subject: z
        .string()
        .optional()
        .describe("Subject like Math, Reading, Science etc."),
    })
  ),
});

export async function POST(req: Request) {
  const { image } = await req.json();

  if (!image) {
    return Response.json({ error: "No image provided" }, { status: 400 });
  }

  const { output } = await generateText({
    model: openrouter("google/gemini-2.5-flash"),
    output: Output.object({ schema: TaskSchema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Look at this image of a homework assignment or task list. Extract every individual task or assignment item. For each task, provide the text description and optionally the subject (Math, Reading, Science, Writing, etc). Be thorough - extract ALL tasks visible in the image. If the text is handwritten, do your best to read it.`,
          },
          {
            type: "image",
            image,
          },
        ],
      },
    ],
  });

  return Response.json({ tasks: output?.tasks ?? [] });
}
